import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'

export const superAdminRouter = Router()

function requirePlatformAdmin(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Admin login required' })
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type !== 'platform_admin') {
      return res.status(401).json({ success: false, message: 'Invalid token type' })
    }
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }
}

// POST /api/v1/super-admin/login
superAdminRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' })
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, email, password_hash, full_name, is_active FROM bmi_platform_admin WHERE email = ?',
      [email]
    )
    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (!admin.is_active) {
      return res.status(403).json({ success: false, message: 'Account is disabled' })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    await db.execute('UPDATE bmi_platform_admin SET last_login_at = NOW() WHERE id = ?', [admin.id])

    const token = jwt.sign(
      { type: 'platform_admin', sub: admin.id, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    return res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
      },
    })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/me
superAdminRouter.get('/me', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, is_active, last_login_at, created_at FROM bmi_platform_admin WHERE id = ?',
      [req.admin.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/dashboard
superAdminRouter.get('/dashboard', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [[totalClients]]  = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_tenant WHERE is_active = 1')
    const [[totalCandidates]] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_candidate')
    const [[totalJobs]]     = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_job')
    const [[totalApps]]     = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_application')
    const [[activeJobs]]    = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_job WHERE status = 'open'")
    const [[clientsMonth]]  = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM bmi_tenant WHERE created_at >= DATE_FORMAT(NOW(), \'%Y-%m-01\')'
    )

    const [monthlyTrend] = await db.execute<RowDataPacket[]>(`
      SELECT
        DATE_FORMAT(month_date, '%b %Y') AS month,
        COALESCE(c.new_clients, 0) AS clients,
        COALESCE(j.new_jobs, 0) AS jobs
      FROM (
        SELECT DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL n MONTH) AS month_date
        FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) nums
      ) months
      LEFT JOIN (
        SELECT DATE_FORMAT(created_at,'%Y-%m-01') AS m, COUNT(*) AS new_clients FROM bmi_tenant GROUP BY m
      ) c ON c.m = DATE_FORMAT(months.month_date,'%Y-%m-01')
      LEFT JOIN (
        SELECT DATE_FORMAT(created_at,'%Y-%m-01') AS m, COUNT(*) AS new_jobs FROM bmi_job GROUP BY m
      ) j ON j.m = DATE_FORMAT(months.month_date,'%Y-%m-01')
      ORDER BY month_date ASC
    `)

    const [topClients] = await db.execute<RowDataPacket[]>(`
      SELECT
        t.id, t.company_name, t.logo_url, t.subscription_status,
        COUNT(DISTINCT j.id)  AS jobs,
        COUNT(DISTINCT c.id)  AS candidates,
        COUNT(DISTINCT a.id)  AS applications
      FROM bmi_tenant t
      LEFT JOIN bmi_job         j ON j.tenant_id = t.id
      LEFT JOIN bmi_candidate   c ON c.tenant_id = t.id
      LEFT JOIN bmi_application a ON a.tenant_id = t.id
      WHERE t.is_active = 1
      GROUP BY t.id
      ORDER BY applications DESC, jobs DESC
      LIMIT 10
    `)

    res.json({
      success: true,
      data: {
        total_clients: (totalClients as any).cnt,
        total_candidates: (totalCandidates as any).cnt,
        total_jobs: (totalJobs as any).cnt,
        total_applications: (totalApps as any).cnt,
        active_jobs: (activeJobs as any).cnt,
        clients_this_month: (clientsMonth as any).cnt,
        monthly_trend: monthlyTrend,
        top_clients: topClients,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/clients
superAdminRouter.get('/clients', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as any
    let where = '1=1'
    const params: any[] = []

    if (search) {
      where += ' AND t.company_name LIKE ?'
      params.push(`%${search}%`)
    }
    if (status === 'active') { where += " AND t.is_active = 1"; }
    else if (status === 'suspended') { where += " AND t.is_active = 0"; }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [clients] = await db.execute<RowDataPacket[]>(`
      SELECT
        t.id, t.company_name, t.plan, t.subscription_status, t.is_active,
        t.onboarding_completed, t.created_at, t.logo_url, t.industry, t.city,
        t.primary_contact_name, t.primary_contact_phone,
        (SELECT COUNT(*) FROM bmi_job WHERE tenant_id = t.id) AS jobs_count,
        (SELECT COUNT(*) FROM bmi_candidate WHERE tenant_id = t.id) AS candidates_count,
        (SELECT COUNT(*) FROM bmi_application WHERE tenant_id = t.id) AS applications_count,
        (SELECT MAX(created_at) FROM bmi_application WHERE tenant_id = t.id) AS last_active
      FROM bmi_tenant t
      WHERE ${where}
      ORDER BY t.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_tenant t WHERE ${where}`, params
    )

    res.json({ success: true, data: { clients, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/clients
superAdminRouter.post('/clients', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { company_name, admin_email, admin_name, admin_password, plan = 'starter' } = req.body
    if (!company_name || !admin_email || !admin_name || !admin_password) {
      return res.status(400).json({ success: false, message: 'company_name, admin_email, admin_name, admin_password required' })
    }

    const tenantId   = crypto.randomUUID()
    const userId     = crypto.randomUUID()
    const pwHash     = await bcrypt.hash(admin_password, 10)
    const tenantCode = company_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8) + '-' + crypto.randomBytes(3).toString('hex').toUpperCase()

    await db.execute(
      `INSERT INTO bmi_tenant (id, tenant_code, company_name, plan, subscription_status, is_active, trial_ends_at, created_at)
       VALUES (?, ?, ?, ?, 'trial', 1, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
      [tenantId, tenantCode, company_name, plan]
    )
    await db.execute(
      `INSERT INTO bmi_user (id, tenant_id, email, password_hash, full_name, role, is_blocked)
       VALUES (?, ?, ?, ?, ?, 'admin', 0)`,
      [userId, tenantId, admin_email, pwHash, admin_name]
    )

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { tenant_id: tenantId, user_id: userId },
    })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/clients/:id
superAdminRouter.get('/clients/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`
      SELECT t.*,
        (SELECT COUNT(*) FROM bmi_job WHERE tenant_id = t.id) AS jobs_count,
        (SELECT COUNT(*) FROM bmi_job WHERE tenant_id = t.id AND status = 'open') AS active_jobs,
        (SELECT COUNT(*) FROM bmi_candidate WHERE tenant_id = t.id) AS candidates_count,
        (SELECT COUNT(*) FROM bmi_application WHERE tenant_id = t.id) AS applications_count,
        (SELECT COUNT(*) FROM bmi_user WHERE tenant_id = t.id) AS users_count
      FROM bmi_tenant t WHERE t.id = ?
    `, [req.params.id])

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Client not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// PATCH /api/v1/super-admin/clients/:id
superAdminRouter.patch('/clients/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const allowed = ['plan', 'subscription_status', 'is_active', 'max_jobs', 'max_candidates']
    const updates: Record<string, any> = {}
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' })
    }
    const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ')
    await db.execute(
      `UPDATE bmi_tenant SET ${setClauses} WHERE id = ?`,
      [...Object.values(updates), req.params.id]
    )
    res.json({ success: true, message: 'Client updated' })
  } catch (err) { next(err) }
})

// DELETE /api/v1/super-admin/clients/:id
superAdminRouter.delete('/clients/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, company_name FROM bmi_tenant WHERE id = ?', [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Client not found' })

    // Soft-delete: deactivate tenant + block all its users
    await db.execute('UPDATE bmi_tenant SET is_active = 0 WHERE id = ?', [req.params.id])
    await db.execute('UPDATE bmi_user SET is_blocked = 1 WHERE tenant_id = ?', [req.params.id])

    res.json({ success: true, message: `Client "${rows[0].company_name}" has been deactivated` })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/clients/:id/reset-password
superAdminRouter.post('/clients/:id/reset-password', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { new_password } = req.body
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    // Find the admin user for this tenant
    const [users] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM bmi_user WHERE tenant_id = ? AND role = 'admin' ORDER BY created_at ASC LIMIT 1",
      [req.params.id]
    )
    if (!users[0]) return res.status(404).json({ success: false, message: 'No admin user found for this client' })

    const hash = await bcrypt.hash(new_password, 10)
    await db.execute('UPDATE bmi_user SET password_hash = ? WHERE id = ?', [hash, users[0].id])

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/candidates
superAdminRouter.get('/candidates', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { search, tenant_id, page = '1', limit = '20' } = req.query as any
    let where = '1=1'
    const params: any[] = []

    if (search) {
      where += ' AND (c.full_name LIKE ? OR c.email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (tenant_id) { where += ' AND c.tenant_id = ?'; params.push(tenant_id) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [candidates] = await db.execute<RowDataPacket[]>(`
      SELECT c.id, c.full_name, c.email, c.experience_years, c.ai_score,
             c.profile_completion, c.current_designation, c.profile_photo_url, c.created_at,
             t.company_name AS tenant_name,
             COUNT(DISTINCT a.id) AS applications_count
      FROM bmi_candidate c
      JOIN bmi_tenant t ON t.id = c.tenant_id
      LEFT JOIN bmi_application a ON a.candidate_id = c.id
      WHERE ${where}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params)

    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_candidate c WHERE ${where}`, params
    )

    res.json({ success: true, data: { candidates, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/analytics
superAdminRouter.get('/analytics', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [[totalApps]]   = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_application')
    const [[totalJobs]]   = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_job')
    const [[totalCands]]  = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_candidate')
    const [[totalTenants]]= await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_tenant WHERE is_active = 1')
    const [[offersRow]]   = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_offer")
    const [[hiredRow]]    = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_application WHERE status IN ('offer_accepted','joined')")

    const [appTrend] = await db.execute<RowDataPacket[]>(`
      SELECT DATE_FORMAT(month_date,'%b %Y') AS month,
             COALESCE(a.apps, 0) AS applications,
             COALESCE(j.jobs, 0) AS jobs,
             COALESCE(c.candidates, 0) AS candidates
      FROM (
        SELECT DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL n MONTH) AS month_date
        FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
              UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) nums
      ) months
      LEFT JOIN (SELECT DATE_FORMAT(applied_at,'%Y-%m-01') AS m, COUNT(*) AS apps FROM bmi_application GROUP BY m) a
        ON a.m = DATE_FORMAT(months.month_date,'%Y-%m-01')
      LEFT JOIN (SELECT DATE_FORMAT(created_at,'%Y-%m-01') AS m, COUNT(*) AS jobs FROM bmi_job GROUP BY m) j
        ON j.m = DATE_FORMAT(months.month_date,'%Y-%m-01')
      LEFT JOIN (SELECT DATE_FORMAT(created_at,'%Y-%m-01') AS m, COUNT(*) AS candidates FROM bmi_candidate GROUP BY m) c
        ON c.m = DATE_FORMAT(months.month_date,'%Y-%m-01')
      ORDER BY month_date ASC
    `)

    const [topTenants] = await db.execute<RowDataPacket[]>(`
      SELECT t.id, t.company_name, t.subscription_status,
             COUNT(DISTINCT j.id) AS jobs,
             COUNT(DISTINCT a.id) AS applications,
             COUNT(DISTINCT c.id) AS candidates
      FROM bmi_tenant t
      LEFT JOIN bmi_job j ON j.tenant_id = t.id
      LEFT JOIN bmi_application a ON a.tenant_id = t.id
      LEFT JOIN bmi_candidate c ON c.tenant_id = t.id
      WHERE t.is_active = 1
      GROUP BY t.id
      ORDER BY applications DESC
      LIMIT 8
    `)

    const [planBreakdown] = await db.execute<RowDataPacket[]>(`
      SELECT plan, COUNT(*) AS count FROM bmi_tenant WHERE is_active = 1 GROUP BY plan
    `)

    res.json({
      success: true,
      data: {
        totals: {
          applications: (totalApps as any).cnt,
          jobs: (totalJobs as any).cnt,
          candidates: (totalCands as any).cnt,
          tenants: (totalTenants as any).cnt,
          offers: (offersRow as any).cnt,
          hired: (hiredRow as any).cnt,
        },
        app_trend: appTrend,
        top_tenants: topTenants,
        plan_breakdown: planBreakdown,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/change-password
superAdminRouter.post('/change-password', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'current_password and new_password are required' })
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
    }
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, password_hash FROM bmi_platform_admin WHERE id = ?', [req.admin.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Admin not found' })
    const valid = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' })
    const hash = await bcrypt.hash(new_password, 10)
    await db.execute('UPDATE bmi_platform_admin SET password_hash = ? WHERE id = ?', [hash, req.admin.sub])
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/clients/:id/jobs
superAdminRouter.get('/clients/:id/jobs', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query as any
    let where = 'j.tenant_id = ?'
    const params: any[] = [req.params.id]

    if (search) { where += ' AND j.title LIKE ?'; params.push(`%${search}%`) }
    if (status) { where += ' AND j.status = ?'; params.push(status) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT j.id, j.title, j.status, j.job_type, j.work_mode, j.description, j.about_job,
              j.experience_min_years, j.experience_max_years, j.salary_min, j.salary_max,
              j.skills_required, j.created_at, j.posted_at, j.closes_at,
              (SELECT COUNT(*) FROM bmi_application WHERE job_id = j.id) AS applications_count
       FROM bmi_job j WHERE ${where} ORDER BY j.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_job j WHERE ${where}`, params
    )
    res.json({ success: true, data: { jobs: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/clients/:id/candidates
superAdminRouter.get('/clients/:id/candidates', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { search, stage, skill, page = '1', limit = '50' } = req.query as any
    let where = 'j.tenant_id = ?'
    const params: any[] = [req.params.id]

    if (search) { where += ' AND (c.full_name LIKE ? OR c.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    if (stage)  { where += ' AND a.current_stage_name = ?'; params.push(stage) }
    if (skill)  { where += ' AND EXISTS (SELECT 1 FROM bmi_candidate_skill cs WHERE cs.candidate_id = c.id AND LOWER(cs.skill_name) LIKE ?)'; params.push(`%${skill.toLowerCase()}%`) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT c.id, c.full_name, c.email, c.mobile, c.experience_years,
              c.profile_completion, c.current_designation, c.current_location,
              c.profile_photo_url, c.ai_score, c.created_at,
              a.current_stage_name, a.status AS application_status, a.applied_at,
              j.title AS applied_job_title
       FROM bmi_candidate c
       JOIN bmi_application a ON a.candidate_id = c.id
       JOIN bmi_job j ON j.id = a.job_id
       WHERE ${where}
       ORDER BY a.applied_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT c.id) AS total FROM bmi_candidate c
       JOIN bmi_application a ON a.candidate_id = c.id
       JOIN bmi_job j ON j.id = a.job_id WHERE ${where}`,
      params
    )
    res.json({ success: true, data: { candidates: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// PATCH /api/v1/super-admin/clients/:id/permissions
superAdminRouter.patch('/clients/:id/permissions', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { permissions } = req.body
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'permissions object is required' })
    }
    await db.execute(
      'UPDATE bmi_tenant SET permissions = ? WHERE id = ?',
      [JSON.stringify(permissions), req.params.id]
    )
    res.json({ success: true, message: 'Permissions updated' })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/candidates/:id — full candidate detail
superAdminRouter.get('/candidates/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.id, c.full_name, c.email, c.mobile, c.gender, c.date_of_birth,
              c.current_location, c.current_designation, c.current_company,
              c.total_experience_years, c.skills_summary, c.professional_summary,
              c.career_objective, c.profile_photo_url, c.resume_url,
              c.linkedin_url, c.github_url, c.portfolio_url,
              c.voice_intro_url, c.voice_intro_duration,
              c.intro_score, c.intro_transcript, c.intro_feedback,
              c.profile_completion, c.ai_score, c.created_at,
              (SELECT COUNT(*) FROM bmi_application a WHERE a.candidate_id = c.id) AS total_applications,
              (SELECT MAX(ca.percentage) FROM bmi_candidate_assessment ca
               JOIN bmi_application a ON a.id = ca.application_id
               WHERE a.candidate_id = c.id AND ca.status = 'completed') AS assessment_score
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

    res.json({ success: true, data: { ...rows[0], skills, education, experience } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/notifications
superAdminRouter.get('/notifications', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query as any
    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT n.id, COALESCE(n.body, n.subject, '') AS message, n.status, n.created_at,
              t.company_name, t.logo_url AS company_logo
       FROM bmi_notification_log n
       LEFT JOIN bmi_tenant t ON t.id = n.tenant_id
       WHERE n.channel = 'in_app' AND n.recipient_type = 'platform_admin'
       ORDER BY n.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      []
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_notification_log WHERE channel = 'in_app' AND recipient_type = 'platform_admin'`,
      []
    )
    const unread = (rows as any[]).filter(r => r.status === 'sent').length
    res.json({ success: true, data: { notifications: rows, total, unread } })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/notifications/read-all
superAdminRouter.post('/notifications/read-all', requirePlatformAdmin, async (_req, res, next) => {
  try {
    await db.execute(
      `UPDATE bmi_notification_log SET status = 'delivered'
       WHERE channel = 'in_app' AND recipient_type = 'platform_admin' AND status = 'sent'`,
      []
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ═══════════════════════════════════════════════════════════════
// JD REQUESTS — Review & approve/reject client JD submissions
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/super-admin/jd-requests
superAdminRouter.get('/jd-requests', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { status = 'pending', search, page = '1', limit = '20' } = req.query as any
    let where = 'jr.status = ?'
    const params: any[] = [status]
    if (search) { where += ' AND (jr.title LIKE ? OR t.company_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT jr.*, t.company_name, t.logo_url, t.primary_contact_name, t.primary_contact_phone
       FROM bmi_jd_request jr
       JOIN bmi_tenant t ON t.id = jr.tenant_id
       WHERE ${where}
       ORDER BY jr.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_jd_request jr JOIN bmi_tenant t ON t.id = jr.tenant_id WHERE ${where}`, params
    )
    res.json({ success: true, data: { requests: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/jd-requests/:id
superAdminRouter.get('/jd-requests/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT jr.*, t.company_name, t.logo_url, t.primary_contact_name, t.primary_contact_email,
              t.primary_contact_phone, t.industry, t.company_size,
              pa.full_name AS reviewer_name
       FROM bmi_jd_request jr
       JOIN bmi_tenant t ON t.id = jr.tenant_id
       LEFT JOIN bmi_platform_admin pa ON pa.id = jr.reviewed_by
       WHERE jr.id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'JD request not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/jd-requests/:id/approve — Approve & create job post
superAdminRouter.post('/jd-requests/:id/approve', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { admin_notes } = req.body

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_jd_request WHERE id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'JD request not found' })
    const jd = rows[0] as any
    if (jd.status !== 'pending') return res.status(400).json({ success: false, message: 'JD request already reviewed' })

    // Create the actual job post
    const jobId = crypto.randomUUID()
    const jobCode = 'JOB-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    const skillsJson = jd.skills_required

    await db.execute(
      `INSERT INTO bmi_job
        (id, tenant_id, job_code, title, description, requirements, job_type, work_mode,
         experience_min_years, experience_max_years, salary_min, salary_max, skills_required,
         status, posted_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), ?, NOW())`,
      [
        jobId, jd.tenant_id, jobCode, jd.title, jd.description ?? null, jd.requirements ?? null,
        jd.job_type ?? 'full_time', jd.work_mode ?? 'onsite',
        jd.experience_min_years ?? 0, jd.experience_max_years ?? null,
        jd.salary_min ?? null, jd.salary_max ?? null, skillsJson, req.admin.sub,
      ]
    )

    // Update JD request status
    await db.execute(
      `UPDATE bmi_jd_request SET
        status = 'approved', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [admin_notes ?? null, req.admin.sub, req.params.id]
    )

    // Notify client
    await db.execute(
      `INSERT INTO bmi_notification_log
        (id, tenant_id, channel, recipient_type, recipient_id, subject, body,
         event_key, reference_id, reference_type, status, created_at)
       VALUES (UUID(), ?, 'in_app', 'admin', 'all',
        ?, ?, 'jd_approved', ?, 'job', 'sent', NOW())`,
      [
        jd.tenant_id,
        `JD Approved: ${jd.title}`,
        `Your job description "${jd.title}" has been approved and posted. Candidates can now apply.`,
        jobId,
      ]
    )

    res.status(201).json({ success: true, message: 'JD approved and job posted', data: { job_id: jobId } })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/jd-requests/:id/reject
superAdminRouter.post('/jd-requests/:id/reject', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { reason } = req.body
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' })

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT tenant_id, title FROM bmi_jd_request WHERE id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'JD request not found' })
    const jd = rows[0] as any

    await db.execute(
      `UPDATE bmi_jd_request SET
        status = 'rejected', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [reason, req.admin.sub, req.params.id]
    )

    await db.execute(
      `INSERT INTO bmi_notification_log
        (id, tenant_id, channel, recipient_type, recipient_id, subject, body,
         event_key, reference_id, reference_type, status, created_at)
       VALUES (UUID(), ?, 'in_app', 'admin', 'all',
        ?, ?, 'jd_rejected', ?, 'jd_request', 'sent', NOW())`,
      [
        jd.tenant_id,
        `JD Request Update: ${jd.title}`,
        `Your job description "${jd.title}" was not approved. Reason: ${reason}`,
        req.params.id,
      ]
    )

    res.json({ success: true, message: 'JD request rejected' })
  } catch (err) { next(err) }
})

// ═══════════════════════════════════════════════════════════════
// INTERVIEW MEDIATION — Super admin mediates & captures interviews
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/super-admin/interviews
superAdminRouter.get('/interviews', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { status, scheduling_status, page = '1', limit = '20' } = req.query as any
    let where = '1=1'
    const params: any[] = []
    if (status) { where += ' AND i.status = ?'; params.push(status) }
    if (scheduling_status) { where += ' AND i.scheduling_status = ?'; params.push(scheduling_status) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.id, i.round_name, i.interview_type, i.mode, i.scheduled_at,
              i.duration_mins, i.meeting_link, i.status, i.scheduling_status,
              i.candidate_proposed_at, i.client_acknowledged_at,
              i.candidate_notes, i.mediator_notes, i.mediator_joined_at,
              c.full_name AS candidate_name, c.email AS candidate_email,
              c.profile_photo_url, c.current_designation,
              j.title AS job_title,
              t.company_name,
              a.id AS application_id,
              pa.full_name AS mediator_name,
              (SELECT COUNT(*) FROM bmi_interview_transcript WHERE interview_id = i.id) AS transcript_count
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       JOIN bmi_tenant t ON t.id = i.tenant_id
       LEFT JOIN bmi_platform_admin pa ON pa.id = i.mediator_id
       WHERE ${where}
       ORDER BY i.scheduled_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_interview i WHERE ${where}`, params
    )
    res.json({ success: true, data: { interviews: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/interviews/:id
superAdminRouter.get('/interviews/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.*,
              c.full_name AS candidate_name, c.email AS candidate_email,
              c.profile_photo_url, c.current_designation, c.resume_url,
              c.experience_years, c.skills_summary,
              j.title AS job_title, j.skills_required AS job_skills,
              t.company_name, t.logo_url AS company_logo,
              a.current_stage_name AS application_stage,
              a.ai_match_score, a.applied_at,
              ca.percentage AS assessment_score, ca.passed AS assessment_passed,
              pa.full_name AS mediator_name
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       JOIN bmi_tenant t ON t.id = i.tenant_id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id AND ca.status = 'completed'
       LEFT JOIN bmi_platform_admin pa ON pa.id = i.mediator_id
       WHERE i.id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Interview not found' })

    const [transcripts] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_interview_transcript WHERE interview_id = ? ORDER BY captured_at ASC`,
      [req.params.id]
    )
    const [recordings] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_interview_recording WHERE interview_id = ? ORDER BY segment_index ASC`,
      [req.params.id]
    )

    res.json({ success: true, data: { ...rows[0], transcripts, recordings } })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/interviews/:id/join — Mediator joins interview
superAdminRouter.post('/interviews/:id/join', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    await db.execute(
      `UPDATE bmi_interview SET
        mediator_id = ?, mediator_joined_at = NOW(),
        scheduling_status = 'in_progress', status = 'in_progress'
       WHERE id = ?`,
      [req.admin.sub, req.params.id]
    )
    res.json({ success: true, message: 'Joined interview as mediator' })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/interviews/:id/complete — Mark interview as completed
superAdminRouter.post('/interviews/:id/complete', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { mediator_notes } = req.body
    await db.execute(
      `UPDATE bmi_interview SET
        status = 'completed', scheduling_status = 'completed',
        mediator_notes = COALESCE(?, mediator_notes),
        updated_at = NOW()
       WHERE id = ?`,
      [mediator_notes ?? null, req.params.id]
    )
    res.json({ success: true, message: 'Interview marked as completed' })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/interviews/:id/transcript — Save interview transcript
superAdminRouter.post('/interviews/:id/transcript', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { transcript_text, transcript_json, recording_url, recording_duration_secs } = req.body

    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_interview_transcript
        (id, interview_id, transcript_text, transcript_json, recording_url, recording_duration_secs, captured_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.id,
        transcript_text ?? null,
        transcript_json ? JSON.stringify(transcript_json) : null,
        recording_url ?? null,
        recording_duration_secs ?? null,
        req.admin.sub,
      ]
    )

    res.status(201).json({ success: true, message: 'Transcript saved', data: { id } })
  } catch (err) { next(err) }
})

// POST /api/v1/super-admin/interviews/:id/recording — Add recording segment
superAdminRouter.post('/interviews/:id/recording', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const { recording_url, segment_index, duration_seconds, file_size_bytes } = req.body
    if (!recording_url) return res.status(400).json({ success: false, message: 'recording_url is required' })

    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_interview_recording
        (id, interview_id, recording_url, segment_index, duration_seconds, file_size_bytes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, recording_url, segment_index ?? 0, duration_seconds ?? null, file_size_bytes ?? null]
    )

    res.status(201).json({ success: true, message: 'Recording saved', data: { id } })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/jd-stats — Stats for JD dashboard
superAdminRouter.get('/jd-stats', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [[pending]]  = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_jd_request WHERE status = 'pending'")
    const [[approved]] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_jd_request WHERE status = 'approved'")
    const [[rejected]] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM bmi_jd_request WHERE status = 'rejected'")
    const [[total]]    = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM bmi_jd_request')
    const [recent]     = await db.execute<RowDataPacket[]>(
      `SELECT jr.id, jr.title, jr.status, jr.created_at, t.company_name
       FROM bmi_jd_request jr
       JOIN bmi_tenant t ON t.id = jr.tenant_id
       ORDER BY jr.created_at DESC LIMIT 5`
    )
    res.json({
      success: true,
      data: {
        pending: (pending as any).cnt,
        approved: (approved as any).cnt,
        rejected: (rejected as any).cnt,
        total: (total as any).cnt,
        recent,
      }
    })
  } catch (err) { next(err) }
})

// GET /api/v1/super-admin/feedback
superAdminRouter.get('/feedback', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { sentiment, feedback_type, type, page = '1', limit = '30' } = req.query as any
    const fbType = feedback_type || type
    let where = '1=1'
    const params: any[] = []

    if (sentiment) { where += ' AND f.sentiment = ?'; params.push(sentiment) }
    if (fbType) { where += ' AND f.feedback_type = ?'; params.push(fbType) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 30))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT f.id, f.candidate_id, f.candidate_name, f.candidate_email,
              f.feedback_type, f.rating, f.message, f.sentiment, f.page_context, f.created_at
       FROM bmi_candidate_feedback f WHERE ${where}
       ORDER BY f.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_candidate_feedback f WHERE ${where}`, params
    )
    const [sentimentRows] = await db.execute<RowDataPacket[]>(
      `SELECT sentiment, COUNT(*) AS cnt FROM bmi_candidate_feedback GROUP BY sentiment`
    )
    const sentimentCounts: Record<string, number> = { positive: 0, neutral: 0, negative: 0 }
    for (const row of sentimentRows as any[]) {
      if (row.sentiment && row.sentiment in sentimentCounts) {
        sentimentCounts[row.sentiment] = Number(row.cnt)
      }
    }
    res.json({ success: true, data: { feedback: rows, total, page: pageNum, limit: limitNum, sentiment_counts: sentimentCounts } })
  } catch (err) { next(err) }
})
