import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'
import { extractJobFromFile } from '../../services/job-extractor.service.js'

export const clientPortalRouter = Router()

// ── Auth middleware ──────────────────────────────────────────
function requireClientAuth(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Login required' })
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type !== 'client') {
      return res.status(401).json({ success: false, message: 'Invalid token type' })
    }
    req.client = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }
}

// ── Multer for JD upload ─────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const jdUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, DOC, or DOCX files are allowed'))
  },
})

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const name = `${crypto.randomUUID()}${ext}`
      cb(null, name)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'))
  },
})

function fileUrl(filename: string): string {
  return `/uploads/${filename}`
}

// ── LOGIN ────────────────────────────────────────────────────
clientPortalRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' })
    }

    // Fetch ALL rows for this email — same email may exist across multiple tenants
    const [rows] = await db.execute<RowDataPacket[]>(
       `SELECT u.id, u.email, u.full_name, u.role, u.password_hash, u.is_blocked, u.tenant_id, u.avatar_url,
              t.company_name, t.is_active AS tenant_active, t.onboarding_completed,
              t.logo_url, t.subscription_status
       FROM bmi_user u
       JOIN bmi_tenant t ON t.id = u.tenant_id
       WHERE u.email = ?`,
      [email]
    )

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    // Find the row whose password_hash actually matches (handles duplicate emails across tenants)
    let user: RowDataPacket | null = null
    for (const row of rows) {
      const match = await bcrypt.compare(password, row.password_hash)
      if (match) { user = row; break }
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' })
    }
    if (!user.tenant_active) {
      return res.status(403).json({ success: false, message: 'Your company account is inactive. Contact support.' })
    }

    const token = jwt.sign(
      {
        type: 'client',
        sub: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    return res.json({
      success: true,
      data: {
        token,
        onboarding_completed: !!user.onboarding_completed,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          tenant_id: user.tenant_id,
          tenant_name: user.company_name,
          logo_url: user.logo_url ?? null,
          avatar_url: user.avatar_url ?? null,
        },
        tenant: {
          id: user.tenant_id,
          company_name: user.company_name,
          logo_url: user.logo_url ?? null,
          onboarding_completed: !!user.onboarding_completed,
          subscription_status: user.subscription_status,
        },
      },
    })
  } catch (err) { next(err) }
})

// ── ME ───────────────────────────────────────────────────────
clientPortalRouter.get('/me', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
       `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.avatar_url,
               t.company_name, t.logo_url, t.onboarding_completed, t.subscription_status,
               t.industry, t.company_size, t.website, t.city, t.state, t.plan
       FROM bmi_user u
       JOIN bmi_tenant t ON t.id = u.tenant_id
       WHERE u.id = ?`,
      [req.client.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ── CHANGE PASSWORD ──────────────────────────────────────────
clientPortalRouter.post('/change-password', requireClientAuth, async (req: any, res, next) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'current_password and new_password are required' })
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, password_hash FROM bmi_user WHERE id = ?', [req.client.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' })

    const valid = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' })

    const hash = await bcrypt.hash(new_password, 10)
    await db.execute('UPDATE bmi_user SET password_hash = ? WHERE id = ?', [hash, req.client.sub])

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) { next(err) }
})

// ── UPDATE LOGO ──────────────────────────────────────────────
clientPortalRouter.patch('/logo', requireClientAuth, async (req: any, res, next) => {
  try {
    const { logo_url } = req.body
    if (!logo_url || typeof logo_url !== 'string') {
      return res.status(400).json({ success: false, message: 'logo_url is required' })
    }
    await db.execute('UPDATE bmi_tenant SET logo_url = ? WHERE id = ?', [logo_url, req.client.tenant_id])
    res.json({ success: true, message: 'Logo updated', data: { logo_url } })
  } catch (err) { next(err) }
})

// ── UPLOAD AVATAR ────────────────────────────────────────────
clientPortalRouter.post('/photo', requireClientAuth, photoUpload.single('photo'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const url = fileUrl(req.file.filename)
    await db.execute('UPDATE bmi_user SET avatar_url = ? WHERE id = ?', [url, req.client.sub])
    res.json({ success: true, message: 'Photo updated', data: { url } })
  } catch (err) { next(err) }
})

// ── ONBOARDING STATUS ────────────────────────────────────────
clientPortalRouter.get('/onboarding-status', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT onboarding_completed, onboarding_completed_at FROM bmi_tenant WHERE id = ?',
      [req.client.tenant_id]
    )
    res.json({ success: true, data: rows[0] ?? { onboarding_completed: false } })
  } catch (err) { next(err) }
})

// ── COMPLETE ONBOARDING ──────────────────────────────────────
clientPortalRouter.post('/complete-onboarding', requireClientAuth, async (req: any, res, next) => {
  try {
    const {
      logo_url, industry, company_size, website, company_tagline,
      address_line1, city, state, pincode, gst_number, cin_number,
      primary_contact_name, primary_contact_phone, primary_contact_designation,
    } = req.body

    await db.execute(
      `UPDATE bmi_tenant SET
        logo_url = ?, industry = ?, company_size = ?, website = ?, company_tagline = ?,
        address_line1 = ?, city = ?, state = ?, pincode = ?, gst_number = ?, cin_number = ?,
        primary_contact_name = ?, primary_contact_phone = ?, primary_contact_designation = ?,
        onboarding_completed = 1, onboarding_completed_at = NOW()
       WHERE id = ?`,
      [
        logo_url ?? null, industry ?? null, company_size ?? null, website ?? null, company_tagline ?? null,
        address_line1 ?? null, city ?? null, state ?? null, pincode ?? null, gst_number ?? null, cin_number ?? null,
        primary_contact_name ?? null, primary_contact_phone ?? null, primary_contact_designation ?? null,
        req.client.tenant_id,
      ]
    )

    res.json({ success: true, message: 'Onboarding completed!' })
  } catch (err) { next(err) }
})

// ── DASHBOARD ────────────────────────────────────────────────
clientPortalRouter.get('/dashboard', requireClientAuth, async (req: any, res, next) => {
  try {
    const tid = req.client.tenant_id

    const [[activeJobsRow]]   = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_job WHERE tenant_id = ? AND status = 'open'", [tid])
    const [[totalCandRow]]    = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_candidate WHERE tenant_id = ?', [tid])
    const [[totalAppsRow]]    = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ?', [tid])
    const [[weekAppsRow]]     = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND applied_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)", [tid])
    const [[interviewsRow]]   = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND current_stage_name LIKE '%interview%'", [tid])
    const [[offersRow]]       = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND current_stage_name LIKE '%offer%'", [tid])
    const [[shortlistedRow]]  = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND current_stage_name LIKE '%shortlist%'", [tid])

    const [applicationsTrend] = await db.execute<RowDataPacket[]>(`
      SELECT
        DATE_FORMAT(week_start, '%d %b') AS week,
        COALESCE(a.cnt, 0) AS applications
      FROM (
        SELECT DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-%d'), INTERVAL (n * 7) DAY) AS week_start
        FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
              UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) nums
      ) weeks
      LEFT JOIN (
        SELECT DATE_FORMAT(DATE_SUB(applied_at, INTERVAL WEEKDAY(applied_at) DAY),'%Y-%m-%d') AS wk,
               COUNT(*) AS cnt
        FROM bmi_application WHERE tenant_id = ?
        GROUP BY wk
      ) a ON a.wk = DATE_FORMAT(weeks.week_start,'%Y-%m-%d')
      ORDER BY week_start ASC
    `, [tid])

    const [topJobs] = await db.execute<RowDataPacket[]>(`
      SELECT j.id, j.title, j.status,
             COUNT(a.id) AS application_count
      FROM bmi_job j
      LEFT JOIN bmi_application a ON a.job_id = j.id
      WHERE j.tenant_id = ?
      GROUP BY j.id, j.title, j.status
      ORDER BY application_count DESC
      LIMIT 5
    `, [tid])

    const [stageBreakdown] = await db.execute<RowDataPacket[]>(`
      SELECT current_stage_name AS stage, COUNT(*) AS count
      FROM bmi_application WHERE tenant_id = ?
      GROUP BY current_stage_name
      ORDER BY count DESC
    `, [tid])

    const [[appliedRow]]     = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ?', [tid])
    const [[reviewedRow]]    = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND current_stage_name NOT LIKE '%Application%'", [tid])
    const [[hiredRow]]       = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND (current_stage_name = 'Hired' OR status = 'hired')", [tid])
    const [[rejectedRow]]    = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE tenant_id = ? AND (current_stage_name = 'Rejected' OR status = 'rejected')", [tid])

    res.json({
      success: true,
      data: {
        active_jobs: (activeJobsRow as any).cnt,
        total_candidates: (totalCandRow as any).cnt,
        total_applications: (totalAppsRow as any).cnt,
        this_week_applications: (weekAppsRow as any).cnt,
        interviews_scheduled: (interviewsRow as any).cnt,
        offers_sent: (offersRow as any).cnt,
        shortlisted: (shortlistedRow as any).cnt,
        hired_count: (hiredRow as any).cnt,
        rejected_count: (rejectedRow as any).cnt,
        applications_trend: applicationsTrend,
        top_jobs: topJobs,
        stage_breakdown: stageBreakdown,
        hiring_funnel: {
          applied: (appliedRow as any).cnt,
          reviewed: (reviewedRow as any).cnt,
          shortlisted: (shortlistedRow as any).cnt,
          offered: (offersRow as any).cnt,
          joined: 0,
        },
      },
    })
  } catch (err) { next(err) }
})

// ── JOBS LIST ────────────────────────────────────────────────
clientPortalRouter.get('/jobs', requireClientAuth, async (req: any, res, next) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as any
    const tid = req.client.tenant_id
    let where = 'j.tenant_id = ?'
    const params: any[] = [tid]

    if (search) { where += ' AND j.title LIKE ?'; params.push(`%${search}%`) }
    if (status) { where += ' AND j.status = ?'; params.push(status) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [jobs] = await db.execute<RowDataPacket[]>(`
      SELECT j.id, j.title, j.status, j.job_type, j.work_mode, j.experience_min_years,
             j.experience_max_years, j.salary_min, j.salary_max, j.skills_required,
             j.created_at, j.posted_at,
             COUNT(a.id) AS application_count
      FROM bmi_job j
      LEFT JOIN bmi_application a ON a.job_id = j.id
      WHERE ${where}
      GROUP BY j.id
      ORDER BY j.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_job j WHERE ${where}`, params
    )

    res.json({ success: true, data: { jobs, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ── CREATE JOB ───────────────────────────────────────────────
clientPortalRouter.post('/jobs', requireClientAuth, async (req: any, res, next) => {
  try {
    const {
      title, description, requirements, responsibilities, job_type = 'full_time',
      work_mode = 'onsite', experience_min_years = 0, experience_max_years,
      salary_min, salary_max, location_city, skills_required,
    } = req.body

    if (!title) return res.status(400).json({ success: false, message: 'Job title is required' })

    const jobId = crypto.randomUUID()
    const skillsJson = Array.isArray(skills_required) ? JSON.stringify(skills_required) : null
    const jobCode = 'JOB-' + crypto.randomBytes(4).toString('hex').toUpperCase()

    await db.execute(
      `INSERT INTO bmi_job (id, tenant_id, job_code, title, description, requirements, job_type, work_mode,
        experience_min_years, experience_max_years, salary_min, salary_max, skills_required,
        status, posted_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), ?, NOW())`,
      [
        jobId, req.client.tenant_id, jobCode, title, description ?? null, requirements ?? null,
        job_type, work_mode, experience_min_years, experience_max_years ?? null,
        salary_min ?? null, salary_max ?? null, skillsJson, req.client.sub,
      ]
    )

    res.status(201).json({ success: true, message: 'Job created', data: { id: jobId } })

    // ── Fire-and-forget: skill-match emails + super admin notification ──
    ;(async () => {
      try {
        const jobSkills: string[] = Array.isArray(skills_required) ? skills_required : []
        const [tenantRows] = await db.execute<RowDataPacket[]>(
          'SELECT company_name FROM bmi_tenant WHERE id = ?', [req.client.tenant_id]
        )
        const company = (tenantRows[0] as any)?.company_name ?? 'A Company'

        let matchedCount = 0
        if (jobSkills.length > 0) {
          const ph = jobSkills.map(() => '?').join(',')
          const [matched] = await db.execute<RowDataPacket[]>(
            `SELECT DISTINCT c.id, c.full_name, c.email
             FROM bmi_candidate_skill cs
             JOIN bmi_candidate c ON c.id = cs.candidate_id
             WHERE LOWER(cs.skill_name) IN (${ph}) AND c.email IS NOT NULL
             LIMIT 200`,
            jobSkills.map((s: string) => s.toLowerCase())
          )
          matchedCount = (matched as any[]).length
          const { sendJobMatchEmail } = await import('../../services/email.service.js')
          for (const cand of matched as any[]) {
            sendJobMatchEmail(cand.email, cand.full_name, title, company, job_type, location_city ?? '', jobSkills).catch(() => {})
          }
        }

        // Super admin notification — always fires when a job is posted
        await db.execute(
          `INSERT INTO bmi_notification_log
            (id, tenant_id, channel, recipient_type, recipient_id, recipient_email,
             subject, body, event_key, reference_id, reference_type, status, created_at)
           VALUES (UUID(), ?, 'in_app', 'platform_admin', 'all', NULL, ?, ?, 'job_posted', ?, 'job', 'sent', NOW())`,
          [
            req.client.tenant_id,
            `New Job: ${title} — ${company}`,
            `${company} posted "${title}".${matchedCount > 0 ? ` ${matchedCount} matching candidates notified.` : ''}`,
            jobId,
          ]
        )

        // Assign assessment if provided
        const { assessment_id } = req.body
        if (assessment_id) {
          await db.execute(
            'UPDATE bmi_assessment SET job_id = ? WHERE id = ? AND tenant_id = ?',
            [jobId, assessment_id, req.client.tenant_id]
          ).catch(() => {})
        }
      } catch (e: any) { console.error('[job-post-notify]', e.message) }
    })()
  } catch (err) { next(err) }
})

// ── JOB DETAIL ───────────────────────────────────────────────
clientPortalRouter.get('/jobs/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT j.id, j.title, j.description, j.requirements, j.job_type, j.work_mode,
             j.experience_min_years, j.experience_max_years, j.salary_min, j.salary_max,
             j.skills_required, j.status, j.job_code, j.created_at, j.posted_at,
             l.city AS location_city,
             COUNT(a.id) AS application_count,
             ass.id AS assessment_id, ass.title AS assessment_title
      FROM bmi_job j
      LEFT JOIN bmi_location l ON l.id = j.location_id
      LEFT JOIN bmi_application a ON a.job_id = j.id
      LEFT JOIN bmi_assessment ass ON ass.job_id = j.id AND ass.tenant_id = j.tenant_id
      WHERE j.id = ? AND j.tenant_id = ?
      GROUP BY j.id, ass.id, l.city
    `, [req.params.id, req.client.tenant_id])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ── JOB APPLICATIONS ─────────────────────────────────────────
clientPortalRouter.get('/jobs/:id/applications', requireClientAuth, async (req: any, res, next) => {
  try {
    const { stage, search, page = '1', limit = '20' } = req.query as any
    const tid = req.client.tenant_id
    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const conditions = ['a.job_id = ?', 'a.tenant_id = ?']
    const params: any[] = [req.params.id, tid]
    if (stage) { conditions.push('a.current_stage_name = ?'); params.push(stage) }
    if (search) {
      conditions.push('(c.full_name LIKE ? OR c.email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    const where = conditions.join(' AND ')

    const [apps] = await db.execute<RowDataPacket[]>(`
      SELECT a.id, a.current_stage_name, a.status, a.applied_at, a.ai_match_score,
             c.id AS candidate_id, c.full_name, c.email, c.mobile,
             c.profile_photo_url, c.current_designation, c.current_company,
             c.experience_years, c.ai_score, c.resume_url,
             c.current_location, c.skills_summary
      FROM bmi_application a
      JOIN bmi_candidate c ON c.id = a.candidate_id
      WHERE ${where}
      ORDER BY a.applied_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_application a JOIN bmi_candidate c ON c.id = a.candidate_id WHERE ${where}`, params
    )

    res.json({ success: true, data: { applications: apps, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ── UPDATE JOB ───────────────────────────────────────────────
clientPortalRouter.patch('/jobs/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const allowed = [
      'title','description','requirements','job_type','work_mode',
      'experience_min_years','experience_max_years','salary_min','salary_max',
      'skills_required','status',
    ]
    const updates: Record<string, any> = {}
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        updates[k] = k === 'skills_required' && Array.isArray(req.body[k])
          ? JSON.stringify(req.body[k])
          : req.body[k]
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' })
    }
    const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ')
    await db.execute(
      `UPDATE bmi_job SET ${setClauses} WHERE id = ? AND tenant_id = ?`,
      [...Object.values(updates), req.params.id, req.client.tenant_id]
    )
    res.json({ success: true, message: 'Job updated' })
  } catch (err) { next(err) }
})

// ── DELETE JOB ──────────────────────────────────────────────
clientPortalRouter.delete('/jobs/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [appRows] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM bmi_application WHERE job_id = ? AND tenant_id = ? AND status NOT IN ('withdrawn','rejected')",
      [req.params.id, req.client.tenant_id]
    )
    const appCount = (appRows[0] as any).cnt ?? 0
    if (appCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete — this job has ${appCount} active application(s). Close the job first or wait for all applications to be resolved.`,
      })
    }
    const [result] = await db.execute<any>(
      'DELETE FROM bmi_job WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.client.tenant_id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, message: 'Job deleted' })
  } catch (err) { next(err) }
})

// ── EXTRACT JOB FROM FILE ────────────────────────────────────
clientPortalRouter.post('/jobs/extract', requireClientAuth, jdUpload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const extracted = await extractJobFromFile(req.file.buffer, req.file.mimetype, req.file.originalname)
    res.json({ success: true, data: extracted })
  } catch (err) { next(err) }
})

// ── CANDIDATES (RANKED) ──────────────────────────────────────
clientPortalRouter.get('/candidates', requireClientAuth, async (req: any, res, next) => {
  try {
    const { search, job_id, page = '1', limit = '20' } = req.query as any
    const tid = req.client.tenant_id
    let searchClause = ''
    const params: any[] = [tid, tid]

    if (search) { searchClause = ' AND (c.full_name LIKE ? OR c.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [candidates] = await db.execute<RowDataPacket[]>(`
      SELECT
        c.id, c.full_name, c.email, c.experience_years, c.ai_score,
        c.profile_completion, c.current_designation, c.current_company,
        c.profile_photo_url, c.created_at,
        COALESCE(avg_assess.avg_score, 0) AS assessment_avg,
        LEAST(COALESCE(c.experience_years, 0) / 10 * 100, 100) AS experience_score,
        (
          COALESCE(c.ai_score, 0) * 0.4 +
          COALESCE(avg_assess.avg_score, 0) * 0.4 +
          LEAST(COALESCE(c.experience_years, 0) / 10 * 100, 100) * 0.2
        ) AS overall_score,
        GROUP_CONCAT(DISTINCT j.title ORDER BY a.applied_at DESC SEPARATOR ', ') AS applied_jobs,
        MAX(a.current_stage_name) AS current_stage
      FROM bmi_candidate c
      LEFT JOIN (
        SELECT candidate_id, AVG(percentage) AS avg_score
        FROM bmi_candidate_assessment WHERE tenant_id = ?
        GROUP BY candidate_id
      ) avg_assess ON avg_assess.candidate_id = c.id
      INNER JOIN bmi_application a ON a.candidate_id = c.id AND a.tenant_id = ?
      LEFT JOIN bmi_job j ON j.id = a.job_id
      WHERE 1=1${searchClause}
      GROUP BY c.id
      ORDER BY overall_score DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    // Add rank numbers
    const startRank = offset + 1
    const ranked = candidates.map((c, i) => ({ ...c, rank: startRank + i }))

    const totalParams = search ? [tid, `%${search}%`, `%${search}%`] : [tid]
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT c.id) AS total FROM bmi_candidate c
       INNER JOIN bmi_application a ON a.candidate_id = c.id AND a.tenant_id = ?
       WHERE 1=1${search ? ' AND (c.full_name LIKE ? OR c.email LIKE ?)' : ''}`, totalParams
    )

    res.json({ success: true, data: { candidates: ranked, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ── APPLICATIONS LIST ────────────────────────────────────────
clientPortalRouter.get('/applications', requireClientAuth, async (req: any, res, next) => {
  try {
    const tid = req.client.tenant_id
    const { search = '', page = '1', limit = '20', stage = '' } = req.query as any
    const pageNum  = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const offset   = (pageNum - 1) * limitNum

    const conditions: string[] = ['a.tenant_id = ?']
    const params: any[] = [tid]

    if (search) {
      conditions.push('(c.full_name LIKE ? OR c.email LIKE ? OR j.title LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (stage) {
      conditions.push('a.current_stage_name = ?')
      params.push(stage)
    }

    const where = conditions.join(' AND ')

    const gateFilter = `AND a.current_stage_name IN ('Interview Scheduled', 'Offer Made', 'Hired', 'Rejected')`

    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT a.id, a.current_stage_name, a.status, a.applied_at,
             c.id AS candidate_id, c.full_name, c.email, c.mobile,
             c.profile_photo_url, c.current_designation, c.current_company,
             c.experience_years, c.ai_score, c.resume_url,
             c.profile_completion, c.intro_score,
             COALESCE(ca.percentage, 0) AS assessment_score,
             j.id AS job_id, j.title AS job_title, j.job_code
      FROM bmi_application a
      JOIN bmi_candidate c ON c.id = a.candidate_id
      JOIN bmi_job j ON j.id = a.job_id
      LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
      WHERE ${where}
      ${gateFilter}
      ORDER BY a.applied_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
       WHERE ${where}
       ${gateFilter}`, params
    )

    res.json({ success: true, data: { applications: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ── APPLICATION DETAIL ───────────────────────────────────────
clientPortalRouter.get('/applications/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const tid = req.client.tenant_id

    const [appRows] = await db.execute<RowDataPacket[]>(`
      SELECT a.id, a.current_stage_name, a.status, a.applied_at, a.notes,
             a.interview_slot_at, a.meeting_link,
             j.id AS job_id, j.title AS job_title, j.job_code, j.work_mode, j.job_type,
             c.id AS candidate_id, c.full_name, c.email, c.mobile,
             c.profile_photo_url, c.current_designation, c.current_company,
             c.experience_years, c.expected_salary, c.current_salary,
             c.current_location, c.work_preference,
             c.ai_score, c.ai_summary, c.resume_url,
             c.professional_summary, c.career_objective,
             c.linkedin_url, c.portfolio_url, c.date_of_birth, c.gender,
             c.voice_intro_url, c.voice_intro_duration, c.github_url, c.skills_summary,
             c.profile_completion, c.intro_score, c.intro_transcript, c.intro_feedback
      FROM bmi_application a
      JOIN bmi_job j ON j.id = a.job_id
      JOIN bmi_candidate c ON c.id = a.candidate_id
      WHERE a.id = ? AND a.tenant_id = ?
    `, [req.params.id, tid])

    if (!appRows[0]) return res.status(404).json({ success: false, message: 'Application not found' })

    const app = appRows[0]
    const candidateId = app.candidate_id

    const [education] = await db.execute<RowDataPacket[]>(
      `SELECT qualification, degree, institute AS institution, university AS board_university,
              percentage AS percentage_grade, passing_year, 0 AS sort_order
       FROM bmi_candidate_education WHERE candidate_id = ? ORDER BY passing_year DESC`,
      [candidateId]
    )
    const [experience] = await db.execute<RowDataPacket[]>(
      `SELECT company_name, designation, joining_date, relieving_date, is_current, roles_responsibilities
       FROM bmi_candidate_experience WHERE candidate_id = ? ORDER BY joining_date DESC`,
      [candidateId]
    )
    const [skills] = await db.execute<RowDataPacket[]>(
      `SELECT skill_name, skill_level AS proficiency_level FROM bmi_candidate_skill WHERE candidate_id = ?`,
      [candidateId]
    )
    const [certifications] = await db.execute<RowDataPacket[]>(
      `SELECT certification_name, issuing_organization, issue_date, expiry_date
       FROM bmi_candidate_certification WHERE candidate_id = ?`,
      [candidateId]
    )
    const [answers] = await db.execute<RowDataPacket[]>(
      `SELECT question_text, answer_text FROM bmi_application_answer WHERE application_id = ?`,
      [req.params.id]
    )
    const [assessmentResult] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id AS candidate_assessment_id,
              ca.percentage AS assessment_score, ca.passed AS assessment_passed,
              ca.scored_marks, ca.total_marks AS assessment_total_marks,
              ca.status AS assessment_status, ca.completed_at,
              ca.answers_submitted_json,
              ass.title AS assessment_title
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment ass ON ass.id = ca.assessment_id
       WHERE ca.application_id = ?
       LIMIT 1`,
      [req.params.id]
    )

    let assessmentData: any = assessmentResult[0] ?? null
    if (assessmentData) {
      try {
        assessmentData = {
          ...assessmentData,
          answers_submitted_json: typeof assessmentData.answers_submitted_json === 'string'
            ? JSON.parse(assessmentData.answers_submitted_json)
            : (assessmentData.answers_submitted_json ?? [])
        }
      } catch { assessmentData = { ...assessmentData, answers_submitted_json: [] } }
    }

    res.json({
      success: true,
      data: { ...app, education, experience, skills, certifications, answers, assessment: assessmentData }
    })
  } catch (err) { next(err) }
})

// ── UPDATE APPLICATION STAGE ─────────────────────────────────
clientPortalRouter.patch('/applications/:id/stage', requireClientAuth, async (req: any, res, next) => {
  try {
    const { stage, meet_link, interview_date, interview_note } = req.body
    const VALID_STAGES = ['Application Received', 'Shortlisted', 'Interview Scheduled', 'Offer Made', 'Rejected', 'Hired']
    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage' })
    }

    let result: any
    if (stage === 'Interview Scheduled' && (meet_link || interview_date)) {
      const notes = JSON.stringify({ meet_link: meet_link ?? null, interview_date: interview_date ?? null, interview_note: interview_note ?? null })
      ;[result] = await db.execute<any>(
        `UPDATE bmi_application SET current_stage_name = ?, notes = ?, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [stage, notes, req.params.id, req.client.tenant_id]
      )
    } else {
      ;[result] = await db.execute<any>(
        `UPDATE bmi_application SET current_stage_name = ?, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [stage, req.params.id, req.client.tenant_id]
      )
    }

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Application not found' })
    res.json({ success: true, message: 'Stage updated' })

    // Fire-and-forget: email + in-app notification to candidate
    ;(async () => {
      try {
        const [rows] = await db.execute<RowDataPacket[]>(
          `SELECT c.email, c.full_name, c.id AS candidate_id,
                  j.title AS job_title, t.company_name
           FROM bmi_application a
           JOIN bmi_candidate c ON c.id = a.candidate_id
           JOIN bmi_job j ON j.id = a.job_id
           JOIN bmi_tenant t ON t.id = a.tenant_id
           WHERE a.id = ?`,
          [req.params.id]
        )
        if (!rows[0]) return
        const { email, full_name, candidate_id, job_title, company_name } = rows[0]
        const co = company_name ?? 'the company'
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

        // Build notification message
        const msgMap: Record<string, { subject: string; body: string }> = {
          'Shortlisted':          { subject: `You've been shortlisted for ${job_title}`,      body: `Great news! You've been shortlisted for ${job_title} at ${co}. The team will reach out soon with next steps.` },
          'Interview Scheduled':  { subject: `Interview scheduled for ${job_title}`,           body: `Your interview for ${job_title} at ${co} has been scheduled.${meet_link ? ` Join: ${meet_link}` : ''}${interview_date ? ` Date: ${new Date(interview_date).toLocaleString('en-IN')}` : ''}` },
          'Offer Made':           { subject: `Offer extended for ${job_title} at ${co}`,       body: `Congratulations! ${co} has extended an offer for the ${job_title} role. Log in to your portal for details.` },
          'Hired':                { subject: `You've been hired at ${co}!`,                    body: `Welcome to the team! You have been officially hired for ${job_title} at ${co}. Onboarding details will follow.` },
          'Rejected':             { subject: `Application update for ${job_title}`,            body: `Thank you for applying to ${job_title} at ${co}. After careful review, we've decided to move forward with other candidates. We wish you the best!` },
        }

        const notif = msgMap[stage]
        if (!notif) return

        // In-app notification
        await db.execute(
          `INSERT INTO bmi_notification_log
           (id, tenant_id, channel, recipient_type, recipient_id, recipient_email,
            event_key, subject, body, status, reference_id, reference_type, created_at)
           VALUES (UUID(), ?, 'in_app', 'candidate', ?, ?, ?, ?, ?, 'sent', ?, 'application', NOW())`,
          [req.client.tenant_id, candidate_id, email, `stage_${stage.toLowerCase().replace(/ /g,'_')}`,
           notif.subject, notif.body, req.params.id]
        )

        // Email
        const {
          sendShortlistEmail, sendInterviewScheduleEmail, sendOfferMadeEmail,
          sendHiredEmail, sendRejectionEmail,
        } = await import('../../services/email.service.js')

        if (stage === 'Shortlisted') {
          await sendShortlistEmail(email, full_name, job_title, co)
        } else if (stage === 'Interview Scheduled') {
          const dt = interview_date ? new Date(interview_date) : null
          await sendInterviewScheduleEmail(
            email, full_name, job_title,
            dt ? dt.toLocaleDateString('en-IN', { dateStyle: 'full' }) : 'TBD',
            dt ? dt.toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'TBD',
            meet_link ? 'Online' : 'In-person',
            meet_link ?? undefined,
          )
        } else if (stage === 'Offer Made') {
          await sendOfferMadeEmail(email, full_name, job_title, co)
        } else if (stage === 'Hired') {
          await sendHiredEmail(email, full_name, job_title, co)
        } else if (stage === 'Rejected') {
          await sendRejectionEmail(email, full_name, job_title, co)
        }
      } catch (e: any) {
        console.error('[stage-notify]', e.message)
      }
    })()
  } catch (err) { next(err) }
})

// ── ASSESSMENTS LIST ─────────────────────────────────────────
clientPortalRouter.get('/assessments', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, title, description, time_limit_mins, total_marks, passing_score, created_at
       FROM bmi_assessment WHERE tenant_id = ? ORDER BY created_at DESC`,
      [req.client.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ── CREATE ASSESSMENT ────────────────────────────────────────
clientPortalRouter.post('/assessments', requireClientAuth, async (req: any, res, next) => {
  try {
    const { title, description, time_limit_mins = 60 } = req.body
    if (!title) return res.status(400).json({ success: false, message: 'Assessment title is required' })

    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_assessment (id, tenant_id, title, description, time_limit_mins, type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'mcq', ?, NOW())`,
      [id, req.client.tenant_id, title, description ?? null, time_limit_mins, req.client.sub]
    )
    res.status(201).json({ success: true, message: 'Assessment created', data: { id } })
  } catch (err) { next(err) }
})

// ── GET ASSESSMENT WITH QUESTIONS ───────────────────────────
clientPortalRouter.get('/assessments/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, title, description, time_limit_mins, total_marks, passing_score, questions, job_id, created_at
       FROM bmi_assessment WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Assessment not found' })

    const assessment = rows[0]
    let parsedQuestions: any[] = []
    if (assessment.questions) {
      try {
        parsedQuestions = typeof assessment.questions === 'string'
          ? JSON.parse(assessment.questions)
          : assessment.questions
      } catch { parsedQuestions = [] }
    }

    res.json({ success: true, data: { ...assessment, questions: parsedQuestions } })
  } catch (err) { next(err) }
})

// ── ADD QUESTION TO ASSESSMENT ───────────────────────────────
clientPortalRouter.post('/assessments/:id/questions', requireClientAuth, async (req: any, res, next) => {
  try {
    const { text, question_type = 'single_choice', options = [], correct_index = 0, marks = 1, difficulty = 'medium' } = req.body
    if (!text) return res.status(400).json({ success: false, message: 'Question text is required' })

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, questions, total_marks FROM bmi_assessment WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Assessment not found' })

    let questions: any[] = []
    if (rows[0].questions) {
      try {
        questions = typeof rows[0].questions === 'string'
          ? JSON.parse(rows[0].questions)
          : rows[0].questions
      } catch { questions = [] }
    }

    const newQuestion = {
      id: crypto.randomUUID(),
      title: text,
      question_type,
      options,
      correct_index,
      marks,
      difficulty,
      order_no: questions.length + 1,
    }
    questions.push(newQuestion)

    const newTotalMarks = questions.reduce((sum: number, q: any) => sum + Number(q.marks ?? 1), 0)

    await db.execute(
      `UPDATE bmi_assessment SET questions = ?, total_marks = ? WHERE id = ? AND tenant_id = ?`,
      [JSON.stringify(questions), newTotalMarks, req.params.id, req.client.tenant_id]
    )

    res.status(201).json({ success: true, message: 'Question added', data: { id: newQuestion.id } })
  } catch (err) { next(err) }
})

// ── DELETE QUESTION FROM ASSESSMENT ─────────────────────────
clientPortalRouter.delete('/assessments/:id/questions/:qid', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, questions FROM bmi_assessment WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Assessment not found' })

    let questions: any[] = []
    if (rows[0].questions) {
      try {
        questions = typeof rows[0].questions === 'string'
          ? JSON.parse(rows[0].questions)
          : rows[0].questions
      } catch { questions = [] }
    }

    const filtered = questions.filter((q: any) => q.id !== req.params.qid)
    const newTotalMarks = filtered.reduce((sum: number, q: any) => sum + Number(q.marks ?? 1), 0)

    await db.execute(
      `UPDATE bmi_assessment SET questions = ?, total_marks = ? WHERE id = ? AND tenant_id = ?`,
      [JSON.stringify(filtered), newTotalMarks, req.params.id, req.client.tenant_id]
    )

    res.json({ success: true, message: 'Question removed' })
  } catch (err) { next(err) }
})

// ── ASSIGN ASSESSMENT TO JOB ─────────────────────────────────
clientPortalRouter.patch('/assessments/:id/assign', requireClientAuth, async (req: any, res, next) => {
  try {
    const { job_id } = req.body
    const [result] = await db.execute<any>(
      `UPDATE bmi_assessment SET job_id = ? WHERE id = ? AND tenant_id = ?`,
      [job_id ?? null, req.params.id, req.client.tenant_id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Assessment not found' })
    res.json({ success: true, message: job_id ? 'Assessment assigned to job' : 'Assessment unassigned' })
  } catch (err) { next(err) }
})

// ── ASSESSMENT DETAILED RESULTS ───────────────────────────────
clientPortalRouter.get('/assessments/:assessmentId/results', requireClientAuth, async (req: any, res, next) => {
  try {
    const [attempts] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.candidate_id, ca.status, ca.scored_marks, ca.total_marks,
              ca.percentage, ca.passed, ca.completed_at, ca.time_taken_secs,
              ca.attempt_count, ca.answers_submitted_json,
              c.full_name AS candidate_name, c.email AS candidate_email,
              c.profile_photo_url
       FROM bmi_candidate_assessment ca
       JOIN bmi_candidate c ON c.id = ca.candidate_id
       JOIN bmi_assessment ass ON ass.id = ca.assessment_id
       WHERE ca.assessment_id = ? AND ass.tenant_id = ? AND ca.status = 'completed'
       ORDER BY ca.completed_at DESC`,
      [req.params.assessmentId, req.client.tenant_id]
    )
    const parsed = (attempts as any[]).map(row => {
      let answers: any[] = []
      try {
        answers = typeof row.answers_submitted_json === 'string'
          ? JSON.parse(row.answers_submitted_json) : (row.answers_submitted_json ?? [])
      } catch { answers = [] }
      return { ...row, answers_submitted_json: answers }
    })
    res.json({ success: true, data: parsed })
  } catch (err) { next(err) }
})

// ── COMPANY PROFILE ───────────────────────────────────────────
clientPortalRouter.get('/company/profile', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT company_name, company_tagline, about_company, culture_description,
              achievements_json, logo_url, website, industry, company_size,
              city, state, address_line1, location_city
       FROM bmi_tenant WHERE id = ?`,
      [req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Company not found' })
    const row = rows[0] as any
    let achievements: any[] = []
    try {
      achievements = typeof row.achievements_json === 'string'
        ? JSON.parse(row.achievements_json) : (row.achievements_json ?? [])
    } catch { achievements = [] }
    res.json({ success: true, data: { ...row, achievements_json: achievements } })
  } catch (err) { next(err) }
})

clientPortalRouter.patch('/company/profile', requireClientAuth, async (req: any, res, next) => {
  try {
    const { about_company, culture_description, achievements_json } = req.body
    await db.execute(
      `UPDATE bmi_tenant SET about_company = ?, culture_description = ?, achievements_json = ? WHERE id = ?`,
      [
        about_company ?? null,
        culture_description ?? null,
        achievements_json != null ? JSON.stringify(achievements_json) : null,
        req.client.tenant_id,
      ]
    )
    res.json({ success: true, message: 'Company profile updated' })
  } catch (err) { next(err) }
})

// ── COMPANY MEDIA ─────────────────────────────────────────────
clientPortalRouter.get('/company/media', requireClientAuth, async (req: any, res, next) => {
  try {
    const { type } = req.query as any
    const sql = type
      ? `SELECT * FROM bmi_company_media WHERE tenant_id = ? AND media_type = ? ORDER BY sort_order ASC, created_at ASC`
      : `SELECT * FROM bmi_company_media WHERE tenant_id = ? ORDER BY media_type ASC, sort_order ASC, created_at ASC`
    const params: any[] = type ? [req.client.tenant_id, type] : [req.client.tenant_id]
    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

clientPortalRouter.post('/company/media', requireClientAuth, async (req: any, res, next) => {
  try {
    const { title, description, file_url, media_type = 'photo', sort_order = 0 } = req.body
    if (!file_url) return res.status(400).json({ success: false, message: 'file_url is required' })
    const newId = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_company_media (id, tenant_id, media_type, title, description, file_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId, req.client.tenant_id, media_type, title ?? null, description ?? null, file_url, sort_order]
    )
    const [inserted] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_company_media WHERE id = ?', [newId]
    )
    res.status(201).json({ success: true, message: 'Media added', data: inserted[0] })
  } catch (err) { next(err) }
})

clientPortalRouter.delete('/company/media/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [result] = await db.execute<any>(
      'DELETE FROM bmi_company_media WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.client.tenant_id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Media not found' })
    res.json({ success: true, message: 'Media deleted' })
  } catch (err) { next(err) }
})

// ── FULL CANDIDATE DETAIL ─────────────────────────────────────
clientPortalRouter.get('/candidates/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.id, c.full_name, c.email, c.mobile, c.gender, c.date_of_birth,
              c.current_location, c.current_designation, c.current_company,
              c.total_experience_years, c.skills_summary, c.professional_summary,
              c.career_objective, c.profile_photo_url, c.resume_url,
              c.linkedin_url, c.github_url, c.portfolio_url,
              c.voice_intro_url, c.voice_intro_duration,
              (SELECT COUNT(*) FROM bmi_application a WHERE a.candidate_id = c.id) AS total_applications
       FROM bmi_candidate c WHERE c.id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Candidate not found' })

    const [skills] = await db.execute<RowDataPacket[]>(
      `SELECT skill_name, skill_level, experience_years FROM bmi_candidate_skill
       WHERE candidate_id = ? ORDER BY sort_order ASC, skill_name ASC`,
      [req.params.id]
    )
    const [education] = await db.execute<RowDataPacket[]>(
      `SELECT degree, specialization, institute, passing_year, percentage
       FROM bmi_candidate_education WHERE candidate_id = ? ORDER BY passing_year DESC`,
      [req.params.id]
    )
    const [experience] = await db.execute<RowDataPacket[]>(
      `SELECT company_name, designation, joining_date, relieving_date, is_current, roles_responsibilities
       FROM bmi_candidate_experience WHERE candidate_id = ? ORDER BY joining_date DESC`,
      [req.params.id]
    )
    const [assessments] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.status, ca.scored_marks, ca.total_marks, ca.percentage, ca.passed,
              ca.completed_at, ca.time_taken_secs,
              ass.title AS assessment_title, j.title AS job_title
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment ass ON ass.id = ca.assessment_id
       LEFT JOIN bmi_job j ON j.id = ass.job_id
       WHERE ca.candidate_id = ? AND ass.tenant_id = ? AND ca.status = 'completed'
       ORDER BY ca.completed_at DESC`,
      [req.params.id, req.client.tenant_id]
    )

    res.json({
      success: true,
      data: { ...rows[0], skills, education, experience, assessments },
    })
  } catch (err) { next(err) }
})

// ═══════════════════════════════════════════════════════════════
// JD REQUESTS — Submit & track JD for super admin approval
// ═══════════════════════════════════════════════════════════════

// POST /api/v1/client/jd-requests — Submit a new JD request
clientPortalRouter.post('/jd-requests', requireClientAuth, jdUpload.single('file'), async (req: any, res, next) => {
  try {
    const {
      title, description, requirements, responsibilities,
      job_type, work_mode, experience_min_years, experience_max_years,
      salary_min, salary_max, skills_required, location,
      source_type = 'manual', existing_job_id,
    } = req.body

    if (!title) return res.status(400).json({ success: false, message: 'Job title is required' })

    let uploadedFileUrl: string | null = null
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase()
      const filename = `${crypto.randomUUID()}${ext}`
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer)
      uploadedFileUrl = fileUrl(filename)
    }

    const id = crypto.randomUUID()
    const skillsJson = Array.isArray(skills_required) ? JSON.stringify(skills_required) : null

    await db.execute(
      `INSERT INTO bmi_jd_request
        (id, tenant_id, title, description, requirements, responsibilities,
         job_type, work_mode, experience_min_years, experience_max_years,
         salary_min, salary_max, skills_required, location,
         source_type, uploaded_file_url, existing_job_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id, req.client.tenant_id, title, description ?? null, requirements ?? null,
        responsibilities ?? null, job_type ?? 'full_time', work_mode ?? 'onsite',
        experience_min_years ?? 0, experience_max_years ?? null,
        salary_min ?? null, salary_max ?? null, skillsJson, location ?? null,
        source_type, uploadedFileUrl, existing_job_id ?? null, req.client.sub,
      ]
    )

    // Notify super admin
    await db.execute(
      `INSERT INTO bmi_notification_log
        (id, tenant_id, channel, recipient_type, recipient_id, subject, body,
         event_key, reference_id, reference_type, status, created_at)
       VALUES (UUID(), ?, 'in_app', 'platform_admin', 'all',
        ?, ?, 'jd_request', ?, 'jd_request', 'sent', NOW())`,
      [
        req.client.tenant_id,
        `New JD Request: ${title}`,
        `Client submitted a new JD request: "${title}". Review in Super Admin portal.`,
        id,
      ]
    )

    res.status(201).json({ success: true, message: 'JD request submitted for review', data: { id } })
  } catch (err) { next(err) }
})

// GET /api/v1/client/jd-requests — List my JD requests
clientPortalRouter.get('/jd-requests', requireClientAuth, async (req: any, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as any
    let where = 'jr.tenant_id = ?'
    const params: any[] = [req.client.tenant_id]
    if (status) { where += ' AND jr.status = ?'; params.push(status) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT jr.*,
              (SELECT COUNT(*) FROM bmi_job WHERE tenant_id = jr.tenant_id AND title = jr.title) AS existing_job_count
       FROM bmi_jd_request jr
       WHERE ${where}
       ORDER BY jr.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_jd_request jr WHERE ${where}`, params
    )
    res.json({ success: true, data: { requests: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/client/jd-requests/:id
clientPortalRouter.get('/jd-requests/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT jr.*, pa.full_name AS reviewer_name
       FROM bmi_jd_request jr
       LEFT JOIN bmi_platform_admin pa ON pa.id = jr.reviewed_by
       WHERE jr.id = ? AND jr.tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'JD request not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ═══════════════════════════════════════════════════════════════
// INTERVIEW MANAGEMENT — For client to acknowledge & share links
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/client/interviews — List interviews for my company
clientPortalRouter.get('/interviews', requireClientAuth, async (req: any, res, next) => {
  try {
    const { status, scheduling_status, page = '1', limit = '20' } = req.query as any
    let where = 'i.tenant_id = ?'
    const params: any[] = [req.client.tenant_id]
    if (status) { where += ' AND i.status = ?'; params.push(status) }
    if (scheduling_status) { where += ' AND i.scheduling_status = ?'; params.push(scheduling_status) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.id, i.round_name, i.interview_type, i.mode, i.scheduled_at,
              i.duration_mins, i.meeting_link, i.status, i.scheduling_status,
              i.candidate_proposed_at, i.client_acknowledged_at,
              i.candidate_notes, i.mediator_notes,
              c.full_name AS candidate_name, c.email AS candidate_email,
              c.profile_photo_url, c.current_designation,
              j.title AS job_title,
              a.id AS application_id,
              (SELECT COUNT(*) FROM bmi_interview_transcript WHERE interview_id = i.id) AS transcript_count
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       WHERE ${where}
       ORDER BY i.scheduled_at DESC, i.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_interview i WHERE ${where}`, params
    )
    res.json({ success: true, data: { interviews: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/client/interviews/:id
clientPortalRouter.get('/interviews/:id', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.*,
              c.full_name AS candidate_name, c.email AS candidate_email,
              c.profile_photo_url, c.current_designation, c.resume_url,
              j.title AS job_title,
              a.id AS application_id,
              a.current_stage_name AS application_stage
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       WHERE i.id = ? AND i.tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Interview not found' })

    const [transcripts] = await db.execute<RowDataPacket[]>(
      `SELECT id, recording_url, recording_duration_secs, captured_at
       FROM bmi_interview_transcript WHERE interview_id = ? ORDER BY captured_at ASC`,
      [req.params.id]
    )

    res.json({ success: true, data: { ...rows[0], transcripts } })
  } catch (err) { next(err) }
})

// POST /api/v1/client/interviews/:id/acknowledge — Acknowledge interview
clientPortalRouter.post('/interviews/:id/acknowledge', requireClientAuth, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, scheduling_status FROM bmi_interview WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Interview not found' })
    if (rows[0].scheduling_status !== 'candidate_scheduled') {
      return res.status(400).json({ success: false, message: 'Interview is not awaiting acknowledgment' })
    }

    await db.execute(
      `UPDATE bmi_interview SET
        scheduling_status = 'client_acknowledged',
        client_acknowledged_at = NOW(),
        client_acknowledged_by = ?
       WHERE id = ?`,
      [req.client.sub, req.params.id]
    )

    res.json({ success: true, message: 'Interview acknowledged' })
  } catch (err) { next(err) }
})

// PATCH /api/v1/client/applications/:id/meeting-link — Client sends meeting link for application
clientPortalRouter.patch('/applications/:id/meeting-link', requireClientAuth, async (req: any, res, next) => {
  try {
    const { meeting_link } = req.body
    if (!meeting_link) return res.status(400).json({ success: false, message: 'meeting_link is required' })

    const [appRows] = await db.execute<RowDataPacket[]>(
      `SELECT a.id, a.interview_slot_at,
              c.email, c.full_name,
              j.title AS job_title,
              t.company_name
       FROM bmi_application a
       JOIN bmi_job j ON j.id = a.job_id
       JOIN bmi_tenant t ON t.id = j.tenant_id
       JOIN bmi_candidate c ON c.id = a.candidate_id
       WHERE a.id = ? AND j.tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    const app = appRows[0] as any
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    await db.execute(
      'UPDATE bmi_application SET meeting_link = ? WHERE id = ?',
      [meeting_link, req.params.id]
    )

    // Email candidate with meeting link
    if (app.email) {
      const { sendMeetingLinkEmail } = await import('../../services/email.service.js')
      const slotStr = app.interview_slot_at
        ? new Date(app.interview_slot_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
        : 'As per agreed schedule'
      sendMeetingLinkEmail(app.email, app.full_name, app.job_title, app.company_name, slotStr, meeting_link).catch(() => {})
    }

    res.json({ success: true, message: 'Meeting link sent to candidate' })
  } catch (err) { next(err) }
})

// POST /api/v1/client/jobs/ai-chat — AI job creation bot
clientPortalRouter.post('/jobs/ai-chat', requireClientAuth, async (req: any, res, next) => {
  try {
    const { messages } = req.body as { messages: Array<{ role: string; content: string }> }
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'messages array required' })
    }

    const { env } = await import('../../config/env.js')
    if (!env.ANTHROPIC_API_KEY) {
      return res.status(501).json({ success: false, message: 'AI chat not configured — add ANTHROPIC_API_KEY to .env' })
    }

    const systemPrompt = `You are a friendly HR assistant helping a client post a job on a hiring platform.
Your goal is to collect these job details through natural conversation:
1. Job title
2. Department / team
3. Job type (full_time, part_time, contract, internship)
4. Work mode (onsite, remote, hybrid)
5. Required experience (min and max years)
6. Key skills required (comma separated)
7. Salary range (optional)
8. Job description (responsibilities and requirements)

Ask one question at a time. Be conversational and friendly.
When you have collected ALL the above details, output a JSON block like this at the end of your message:

\`\`\`json
{
  "complete": true,
  "title": "...",
  "job_type": "full_time|part_time|contract|internship",
  "work_mode": "onsite|remote|hybrid",
  "experience_min_years": 0,
  "experience_max_years": 5,
  "skills_required": "skill1, skill2",
  "salary_min": 500000,
  "salary_max": 800000,
  "description": "...",
  "requirements": "..."
}
\`\`\`

Until you have all details, keep asking. Never output the JSON block until you have everything.`

    const { default: axios } = await import('axios')
    const resp = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      },
      {
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const replyText: string = resp.data?.content?.[0]?.text ?? ''

    // Check if complete JSON block present
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)```/)
    let extracted: any = null
    if (jsonMatch) {
      try {
        extracted = JSON.parse(jsonMatch[1])
      } catch { /* not valid JSON yet */ }
    }

    res.json({ success: true, data: { reply: replyText, extracted } })
  } catch (err: any) {
    if (err.response?.data) {
      console.error('[ai-chat]', err.response.data)
    }
    next(err)
  }
})

// POST /api/v1/client/interviews/:id/meeting-link — Share meeting link
clientPortalRouter.post('/interviews/:id/meeting-link', requireClientAuth, async (req: any, res, next) => {
  try {
    const { meeting_link } = req.body
    if (!meeting_link) return res.status(400).json({ success: false, message: 'meeting_link is required' })

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, scheduling_status FROM bmi_interview WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.client.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Interview not found' })

    await db.execute(
      `UPDATE bmi_interview SET
        meeting_link = ?,
        scheduling_status = 'meeting_shared',
        updated_at = NOW()
       WHERE id = ?`,
      [meeting_link, req.params.id]
    )

    // Notify candidate
    const [appRows] = await db.execute<RowDataPacket[]>(
      `SELECT c.email, c.full_name, j.title AS job_title
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       WHERE i.id = ?`,
      [req.params.id]
    )
    if (appRows[0]?.email) {
      const { sendInterviewScheduleEmail } = await import('../../services/email.service.js')
      const d = new Date()
      sendInterviewScheduleEmail(
        appRows[0].email, appRows[0].full_name, appRows[0].job_title,
        d.toLocaleDateString('en-IN', { dateStyle: 'full' }),
        d.toLocaleTimeString('en-IN', { timeStyle: 'short' }),
        'Online', meeting_link
      ).catch(() => {})
    }

    res.json({ success: true, message: 'Meeting link shared' })
  } catch (err) { next(err) }
})
