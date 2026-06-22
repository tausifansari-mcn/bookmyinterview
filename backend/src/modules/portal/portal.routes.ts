import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'
import { sendOTPEmail, sendWelcomeEmail, sendApplicationConfirmationEmail } from '../../services/email.service.js'
import { evaluateApplication } from '../../services/evaluation.service.js'

export const portalRouter = Router()

const DEMO_TENANT = 'bmi0-0000-0000-0000-000000000001'

function sha256(val: string) {
  return crypto.createHash('sha256').update(val.toLowerCase().trim()).digest('hex')
}

function candidateToken(candidate: any) {
  return jwt.sign(
    { sub: candidate.id, email: candidate.email, mobile: candidate.mobile, tenant_id: candidate.tenant_id, type: 'candidate' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function requireCandidate(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Login required' })
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type !== 'candidate') return res.status(401).json({ success: false, message: 'Invalid token type' })
    req.candidate = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired, please login again' })
  }
}

// Recompute and save profile completion score
async function refreshCompletion(candidateId: string): Promise<number> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*,
      (SELECT COUNT(*) FROM bmi_candidate_education  WHERE candidate_id = c.id) AS edu_count,
      (SELECT COUNT(*) FROM bmi_candidate_experience WHERE candidate_id = c.id) AS exp_count,
      (SELECT COUNT(*) FROM bmi_candidate_skill      WHERE candidate_id = c.id) AS skill_count
     FROM bmi_candidate c WHERE c.id = ?`,
    [candidateId]
  )
  const c = rows[0]
  if (!c) return 0

  let pct = 0
  if (c.profile_photo_url)                                                   pct += 20
  if (c.resume_url)                                                          pct += 20
  if (c.full_name && c.gender && c.date_of_birth)                            pct += 15
  if (c.mobile && c.email)                                                   pct += 10
  if (c.edu_count > 0)                                                       pct += 10
  if (c.exp_count > 0)                                                       pct += 10
  if (c.skill_count > 0)                                                     pct += 5
  if (c.work_preference && c.current_location)                               pct += 5
  if (c.voice_intro_url || c.professional_summary || c.career_objective)     pct += 5
  pct = Math.min(100, pct)

  await db.execute('UPDATE bmi_candidate SET profile_completion = ? WHERE id = ?', [pct, candidateId])
  return pct
}

// ─── REGISTER ────────────────────────────────────────────────
const registerSchema = z.object({
  full_name:        z.string().min(2).max(100),
  email:            z.string().email(),
  mobile:           z.string().min(10).max(15),
  password:         z.string().min(6, 'Password must be at least 6 characters'),
  current_location: z.string().optional(),
  experience_years: z.coerce.number().min(0).max(50).optional(),
})

portalRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body)

    const emailHash = sha256(body.email)
    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_candidate WHERE email_hash = ? AND tenant_id = ?',
      [emailHash, DEMO_TENANT]
    )
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' })
    }

    const passwordHash = await bcrypt.hash(body.password, 10)
    const mobileHash   = sha256(body.mobile)
    const candidateId  = crypto.randomUUID()

    const [countRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM bmi_candidate WHERE tenant_id = ?', [DEMO_TENANT]
    )
    const count = (countRows[0] as any).cnt + 1
    const candidateCode = `CAN-${String(count).padStart(4, '0')}`

    await db.execute(
      `INSERT INTO bmi_candidate
        (id, tenant_id, candidate_code, full_name, email, password_hash, mobile, mobile_hash, email_hash,
         current_location, experience_years, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'direct')`,
      [
        candidateId, DEMO_TENANT, candidateCode,
        body.full_name, body.email, passwordHash,
        body.mobile, mobileHash, emailHash,
        body.current_location ?? null,
        body.experience_years ?? null,
      ]
    )

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, mobile, tenant_id, candidate_code FROM bmi_candidate WHERE id = ?',
      [candidateId]
    )
    const candidate = rows[0]

    // Send welcome email (non-blocking)
    sendWelcomeEmail(body.email, body.full_name).catch(() => {})

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: { token: candidateToken(candidate), candidate }
    })
  } catch (err) {
    next(err)
  }
})

// ─── LOGIN ───────────────────────────────────────────────────
portalRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(), password: z.string().min(1)
    }).parse(req.body)

    const emailHash = sha256(email)
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, email, full_name, mobile, password_hash, tenant_id, candidate_code, is_blacklisted, profile_photo_url
       FROM bmi_candidate WHERE email_hash = ? AND tenant_id = ?`,
      [emailHash, DEMO_TENANT]
    )

    const candidate = rows[0]
    if (!candidate) {
      const e: any = new Error('No account found with this email. Please register first.'); e.status = 401; throw e
    }
    if (candidate.is_blacklisted) {
      const e: any = new Error('Your account has been suspended. Please contact support.'); e.status = 403; throw e
    }
    if (!candidate.password_hash) {
      const e: any = new Error('This account was created by a recruiter. Use forgot password to set your password.'); e.status = 401; throw e
    }

    const valid = await bcrypt.compare(password, candidate.password_hash)
    if (!valid) {
      const e: any = new Error('Invalid email or password. Please check your credentials.'); e.status = 401; throw e
    }

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: candidateToken(candidate),
        candidate: {
          id: candidate.id, email: candidate.email, full_name: candidate.full_name,
          mobile: candidate.mobile, candidate_code: candidate.candidate_code,
          tenant_id: candidate.tenant_id, profile_photo_url: candidate.profile_photo_url ?? null,
        }
      }
    })
  } catch (err) { next(err) }
})

// ─── MY PROFILE ──────────────────────────────────────────────
portalRouter.get('/me', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, candidate_code, full_name, middle_name, last_name, email, mobile,
              alternate_mobile, alternate_email, gender, date_of_birth, marital_status, nationality,
              profile_photo_url, linkedin_url, github_url, portfolio_url,
              current_address_line1, current_address_line2, current_city, current_state,
              current_country, current_pincode, permanent_same_as_current,
              permanent_address_line1, permanent_address_line2, permanent_city, permanent_state,
              permanent_country, permanent_pincode,
              current_location, preferred_location, highest_education,
              current_company, current_designation, experience_years, total_experience_years,
              relevant_experience_years, notice_period_days, current_salary, expected_salary,
              current_ctc, expected_ctc, work_preference, resume_url, skills_summary,
              professional_summary, about_me, career_objective,
              voice_intro_url, voice_intro_duration,
              intro_score, intro_transcript, intro_feedback,
              ai_score, ai_summary, tags, profile_completion, created_at
       FROM bmi_candidate WHERE id = ?`,
      [req.candidate.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Profile not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ─── DELETE RESUME ──────────────────────────────────────────
portalRouter.delete('/me/resume', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'UPDATE bmi_candidate SET resume_url = NULL, resume_text = NULL WHERE id = ?',
      [req.candidate.sub]
    )
    res.json({ success: true, message: 'Resume deleted' })
  } catch (err) { next(err) }
})

// ─── UPDATE BASIC PROFILE ─────────────────────────────────────
portalRouter.patch('/me', requireCandidate, async (req: any, res, next) => {
  try {
    const allowed = [
      'full_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'marital_status', 'nationality',
      'profile_photo_url', 'mobile', 'alternate_mobile', 'alternate_email',
      'linkedin_url', 'github_url', 'portfolio_url',
      'current_address_line1', 'current_address_line2', 'current_city', 'current_state',
      'current_country', 'current_pincode', 'permanent_same_as_current',
      'permanent_address_line1', 'permanent_address_line2', 'permanent_city', 'permanent_state',
      'permanent_country', 'permanent_pincode',
      'current_location', 'preferred_location', 'highest_education',
      'current_company', 'current_designation', 'experience_years', 'total_experience_years',
      'relevant_experience_years', 'notice_period_days', 'current_salary', 'expected_salary',
      'current_ctc', 'expected_ctc', 'work_preference', 'resume_url', 'skills_summary',
      'professional_summary', 'about_me', 'career_objective', 'voice_intro_url', 'voice_intro_duration',
    ]
    const DATE_FIELDS = new Set(['date_of_birth'])
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (req.body[key] === undefined) continue
      const val = req.body[key]
      // Normalize DATE fields: strip time component from ISO datetime strings
      if (DATE_FIELDS.has(key) && typeof val === 'string' && val.includes('T')) {
        updates[key] = val.split('T')[0]
      } else {
        updates[key] = val
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' })
    }
    const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ')
    await db.execute(
      `UPDATE bmi_candidate SET ${setClauses} WHERE id = ?`,
      [...Object.values(updates), req.candidate.sub]
    )
    const completion = await refreshCompletion(req.candidate.sub)
    res.json({ success: true, message: 'Profile updated', data: { profile_completion: completion } })
  } catch (err) { next(err) }
})

// ─── PROFILE COMPLETION ──────────────────────────────────────
portalRouter.get('/me/completion', requireCandidate, async (req: any, res, next) => {
  try {
    const pct = await refreshCompletion(req.candidate.sub)
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.profile_photo_url, c.resume_url, c.full_name, c.gender, c.date_of_birth,
              c.mobile, c.email, c.work_preference, c.current_location, c.professional_summary,
              c.career_objective, c.voice_intro_url,
              (SELECT COUNT(*) FROM bmi_candidate_education  WHERE candidate_id = c.id) AS edu_count,
              (SELECT COUNT(*) FROM bmi_candidate_experience WHERE candidate_id = c.id) AS exp_count,
              (SELECT COUNT(*) FROM bmi_candidate_skill      WHERE candidate_id = c.id) AS skill_count
       FROM bmi_candidate c WHERE c.id = ?`,
      [req.candidate.sub]
    )
    const c = rows[0]
    const breakdown = {
      profile_photo:       { label: 'Profile Photo',       pct: 20, done: !!c?.profile_photo_url },
      resume:              { label: 'Resume Upload',        pct: 20, done: !!c?.resume_url },
      personal_info:       { label: 'Personal Information', pct: 15, done: !!(c?.full_name && c?.gender && c?.date_of_birth) },
      contact_info:        { label: 'Contact Information',  pct: 10, done: !!(c?.mobile && c?.email) },
      education:           { label: 'Education',            pct: 10, done: (c?.edu_count ?? 0) > 0 },
      experience:          { label: 'Experience',           pct: 10, done: (c?.exp_count ?? 0) > 0 },
      skills:              { label: 'Skills',               pct:  5, done: (c?.skill_count ?? 0) > 0 },
      job_preferences:     { label: 'Job Preferences',      pct:  5, done: !!(c?.work_preference && c?.current_location) },
      short_introduction:  { label: 'Short Introduction',   pct:  5, done: !!(c?.voice_intro_url || c?.professional_summary || c?.career_objective) },
    }
    res.json({ success: true, data: { profile_completion: pct, breakdown } })
  } catch (err) { next(err) }
})

// ─── EDUCATION CRUD ──────────────────────────────────────────
portalRouter.get('/me/education', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_education WHERE candidate_id = ? ORDER BY sort_order, passing_year DESC',
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

const eduSchema = z.object({
  qualification:  z.string().min(1).max(100),
  degree:         z.string().min(1).max(200),
  specialization: z.string().max(200).optional(),
  institute:      z.string().min(1).max(300),
  university:     z.string().max(300).optional(),
  passing_year:   z.coerce.number().min(1950).max(new Date().getFullYear() + 5).optional().nullable(),
  percentage:     z.coerce.number().min(0).max(100).optional().nullable(),
  cgpa:           z.coerce.number().min(0).max(10).optional().nullable(),
  sort_order:     z.coerce.number().optional(),
})

portalRouter.post('/me/education', requireCandidate, async (req: any, res, next) => {
  try {
    const body = eduSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_candidate_education
        (id, tenant_id, candidate_id, qualification, degree, specialization, institute, university,
         passing_year, percentage, cgpa, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, DEMO_TENANT, req.candidate.sub, body.qualification, body.degree,
       body.specialization ?? null, body.institute, body.university ?? null,
       body.passing_year ?? null, body.percentage ?? null, body.cgpa ?? null, body.sort_order ?? 0]
    )
    await refreshCompletion(req.candidate.sub)
    res.status(201).json({ success: true, message: 'Education added', data: { id } })
  } catch (err) { next(err) }
})

portalRouter.put('/me/education/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const body = eduSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_candidate_education SET qualification=?, degree=?, specialization=?, institute=?,
       university=?, passing_year=?, percentage=?, cgpa=?, sort_order=?
       WHERE id = ? AND candidate_id = ?`,
      [body.qualification, body.degree, body.specialization ?? null, body.institute,
       body.university ?? null, body.passing_year ?? null, body.percentage ?? null,
       body.cgpa ?? null, body.sort_order ?? 0, req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Education updated' })
  } catch (err) { next(err) }
})

portalRouter.delete('/me/education/:id', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_candidate_education WHERE id = ? AND candidate_id = ?',
      [req.params.id, req.candidate.sub]
    )
    await refreshCompletion(req.candidate.sub)
    res.json({ success: true, message: 'Education deleted' })
  } catch (err) { next(err) }
})

// ─── EXPERIENCE CRUD ──────────────────────────────────────────
portalRouter.get('/me/experience', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_experience WHERE candidate_id = ? ORDER BY is_current DESC, joining_date DESC',
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

const expSchema = z.object({
  company_name:          z.string().min(1).max(300),
  designation:           z.string().min(1).max(200),
  joining_date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  relieving_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_current:            z.coerce.number().min(0).max(1).optional(),
  roles_responsibilities: z.string().max(3000).optional(),
  sort_order:            z.coerce.number().optional(),
})

portalRouter.post('/me/experience', requireCandidate, async (req: any, res, next) => {
  try {
    const body = expSchema.parse(req.body)
    const id = crypto.randomUUID()
    if (body.is_current) {
      await db.execute(
        'UPDATE bmi_candidate_experience SET is_current = 0 WHERE candidate_id = ?',
        [req.candidate.sub]
      )
    }
    await db.execute(
      `INSERT INTO bmi_candidate_experience
        (id, tenant_id, candidate_id, company_name, designation, joining_date, relieving_date,
         is_current, roles_responsibilities, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, DEMO_TENANT, req.candidate.sub, body.company_name, body.designation,
       body.joining_date, body.relieving_date ?? null,
       body.is_current ? 1 : 0, body.roles_responsibilities ?? null, body.sort_order ?? 0]
    )
    await refreshCompletion(req.candidate.sub)
    res.status(201).json({ success: true, message: 'Experience added', data: { id } })
  } catch (err) { next(err) }
})

portalRouter.put('/me/experience/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const body = expSchema.parse(req.body)
    if (body.is_current) {
      await db.execute(
        'UPDATE bmi_candidate_experience SET is_current = 0 WHERE candidate_id = ? AND id != ?',
        [req.candidate.sub, req.params.id]
      )
    }
    await db.execute(
      `UPDATE bmi_candidate_experience SET company_name=?, designation=?, joining_date=?,
       relieving_date=?, is_current=?, roles_responsibilities=?, sort_order=?
       WHERE id = ? AND candidate_id = ?`,
      [body.company_name, body.designation, body.joining_date, body.relieving_date ?? null,
       body.is_current ? 1 : 0, body.roles_responsibilities ?? null,
       body.sort_order ?? 0, req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Experience updated' })
  } catch (err) { next(err) }
})

portalRouter.delete('/me/experience/:id', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_candidate_experience WHERE id = ? AND candidate_id = ?',
      [req.params.id, req.candidate.sub]
    )
    await refreshCompletion(req.candidate.sub)
    res.json({ success: true, message: 'Experience deleted' })
  } catch (err) { next(err) }
})

// ─── SKILLS CRUD ──────────────────────────────────────────────
portalRouter.get('/me/skills', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_skill WHERE candidate_id = ? ORDER BY sort_order, skill_name',
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

const skillSchema = z.object({
  skill_name:       z.string().min(1).max(100),
  experience_years: z.coerce.number().min(0).max(50).optional().nullable(),
  skill_level:      z.enum(['beginner','intermediate','advanced','expert']).optional(),
  sort_order:       z.coerce.number().optional(),
})

portalRouter.post('/me/skills', requireCandidate, async (req: any, res, next) => {
  try {
    const body = skillSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_candidate_skill (id, tenant_id, candidate_id, skill_name, experience_years, skill_level, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, DEMO_TENANT, req.candidate.sub, body.skill_name,
       body.experience_years ?? null, body.skill_level ?? 'intermediate', body.sort_order ?? 0]
    )
    await refreshCompletion(req.candidate.sub)
    res.status(201).json({ success: true, message: 'Skill added', data: { id } })
  } catch (err) { next(err) }
})

portalRouter.put('/me/skills/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const body = skillSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_candidate_skill SET skill_name=?, experience_years=?, skill_level=?, sort_order=?
       WHERE id = ? AND candidate_id = ?`,
      [body.skill_name, body.experience_years ?? null, body.skill_level ?? 'intermediate',
       body.sort_order ?? 0, req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Skill updated' })
  } catch (err) { next(err) }
})

portalRouter.delete('/me/skills/:id', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_candidate_skill WHERE id = ? AND candidate_id = ?',
      [req.params.id, req.candidate.sub]
    )
    await refreshCompletion(req.candidate.sub)
    res.json({ success: true, message: 'Skill deleted' })
  } catch (err) { next(err) }
})

// ─── CERTIFICATIONS CRUD ──────────────────────────────────────
portalRouter.get('/me/certifications', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_certification WHERE candidate_id = ? ORDER BY sort_order, issue_date DESC',
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// Strip ISO time component from date-only fields before saving to MySQL DATE column
const toDateOnly = z.string().transform(v => v.includes('T') ? v.split('T')[0] : v)
const toDateOnlyOpt = z.string().transform(v => v.includes('T') ? v.split('T')[0] : v).optional().nullable()

const certSchema = z.object({
  certification_name:    z.string().min(1).max(300),
  issuing_organization:  z.string().min(1).max(300),
  issue_date:            toDateOnlyOpt,
  expiry_date:           toDateOnlyOpt,
  certificate_url:       z.string().url().optional().nullable(),
  sort_order:            z.coerce.number().optional(),
})

portalRouter.post('/me/certifications', requireCandidate, async (req: any, res, next) => {
  try {
    const body = certSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_candidate_certification
        (id, tenant_id, candidate_id, certification_name, issuing_organization, issue_date, expiry_date, certificate_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, DEMO_TENANT, req.candidate.sub, body.certification_name, body.issuing_organization,
       body.issue_date ?? null, body.expiry_date ?? null, body.certificate_url ?? null, body.sort_order ?? 0]
    )
    res.status(201).json({ success: true, message: 'Certification added', data: { id } })
  } catch (err) { next(err) }
})

portalRouter.put('/me/certifications/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const body = certSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_candidate_certification SET certification_name=?, issuing_organization=?,
       issue_date=?, expiry_date=?, certificate_url=?, sort_order=?
       WHERE id = ? AND candidate_id = ?`,
      [body.certification_name, body.issuing_organization, body.issue_date ?? null,
       body.expiry_date ?? null, body.certificate_url ?? null, body.sort_order ?? 0,
       req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Certification updated' })
  } catch (err) { next(err) }
})

portalRouter.delete('/me/certifications/:id', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_candidate_certification WHERE id = ? AND candidate_id = ?',
      [req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Certification deleted' })
  } catch (err) { next(err) }
})

// ─── LANGUAGES CRUD ───────────────────────────────────────────
portalRouter.get('/me/languages', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_language WHERE candidate_id = ? ORDER BY sort_order, language',
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

const langSchema = z.object({
  language:    z.string().min(1).max(100),
  can_read:    z.coerce.number().min(0).max(1).optional(),
  can_write:   z.coerce.number().min(0).max(1).optional(),
  can_speak:   z.coerce.number().min(0).max(1).optional(),
  proficiency: z.enum(['basic','conversational','proficient','fluent','native']).optional(),
  sort_order:  z.coerce.number().optional(),
})

portalRouter.post('/me/languages', requireCandidate, async (req: any, res, next) => {
  try {
    const body = langSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_candidate_language
        (id, tenant_id, candidate_id, language, can_read, can_write, can_speak, proficiency, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, DEMO_TENANT, req.candidate.sub, body.language,
       body.can_read ?? 0, body.can_write ?? 0, body.can_speak ?? 1,
       body.proficiency ?? 'conversational', body.sort_order ?? 0]
    )
    res.status(201).json({ success: true, message: 'Language added', data: { id } })
  } catch (err) { next(err) }
})

portalRouter.put('/me/languages/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const body = langSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_candidate_language SET language=?, can_read=?, can_write=?, can_speak=?, proficiency=?, sort_order=?
       WHERE id = ? AND candidate_id = ?`,
      [body.language, body.can_read ?? 0, body.can_write ?? 0, body.can_speak ?? 1,
       body.proficiency ?? 'conversational', body.sort_order ?? 0, req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Language updated' })
  } catch (err) { next(err) }
})

portalRouter.delete('/me/languages/:id', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_candidate_language WHERE id = ? AND candidate_id = ?',
      [req.params.id, req.candidate.sub]
    )
    res.json({ success: true, message: 'Language deleted' })
  } catch (err) { next(err) }
})

// ─── BROWSE OPEN JOBS ────────────────────────────────────────
portalRouter.get('/jobs', async (req, res, next) => {
  try {
    const { search, location, job_type, work_mode, page = '1', limit = '10' } = req.query as any
    // Show jobs from ALL active tenants (multi-tenant marketplace)
    let where = `j.status = 'open' AND t.is_active = 1`
    const params: any[] = []

    if (search) { where += ` AND (j.title LIKE ? OR j.description LIKE ? OR t.company_name LIKE ? OR j.skills_required LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) }
    if (location) { where += ` AND (l.city LIKE ? OR l.state LIKE ?)`; params.push(`%${location}%`, `%${location}%`) }
    if (job_type) { where += ` AND j.job_type = ?`; params.push(job_type) }
    if (work_mode) { where += ` AND j.work_mode = ?`; params.push(work_mode) }

    const pageNum   = Math.max(1, parseInt(page) || 1)
    const limitNum  = Math.min(50, Math.max(1, parseInt(limit) || 10))
    const offsetNum = (pageNum - 1) * limitNum

    const [jobs] = await db.execute<RowDataPacket[]>(
      `SELECT j.id, j.job_code, j.title, j.job_type, j.work_mode,
              j.experience_min_years, j.experience_max_years,
              j.salary_min, j.salary_max, j.skills_required, j.skills_mandatory,
              j.description, j.about_job, j.priority, j.posted_at, j.closes_at,
              t.company_name, t.logo_url AS company_logo_url,
              d.name AS department_name,
              l.city AS location_city, l.state AS location_state,
              (SELECT COUNT(*) FROM bmi_job_question WHERE job_id = j.id) AS question_count
       FROM bmi_job j
       JOIN bmi_tenant t ON t.id = j.tenant_id
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location   l ON l.id = j.location_id
       WHERE ${where}
       ORDER BY j.created_at DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    )

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_job j JOIN bmi_tenant t ON t.id = j.tenant_id WHERE ${where}`, params
    )
    const total = (countRows[0] as any).total

    res.json({ success: true, data: { jobs, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ─── PUBLIC COMPANIES LISTING ────────────────────────────────
portalRouter.get('/companies', async (_req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT t.id, t.company_name, t.logo_url, t.industry, t.company_size,
              t.city, t.state, t.about_company,
              COUNT(j.id) AS job_count
       FROM bmi_tenant t
       INNER JOIN bmi_job j ON j.tenant_id = t.id AND j.status = 'open'
       WHERE t.is_active = 1
       GROUP BY t.id
       ORDER BY job_count DESC`
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ─── JOB DETAIL ──────────────────────────────────────────────
portalRouter.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT j.*, t.company_name, t.logo_url AS company_logo_url,
              t.about_company, t.culture_description, t.achievements_json,
              t.industry, t.company_size, t.website, t.city AS company_city, t.state AS company_state,
              d.name AS department_name, l.city AS location_city, l.state AS location_state
       FROM bmi_job j
       JOIN bmi_tenant t ON t.id = j.tenant_id
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location   l ON l.id = j.location_id
       WHERE j.id = ? AND j.status = 'open' AND t.is_active = 1`,
      [req.params.jobId]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Job not found' })

    const [questions] = await db.execute<RowDataPacket[]>(
      `SELECT id, question, question_type, options, is_mandatory, sort_order
       FROM bmi_job_question WHERE job_id = ? ORDER BY sort_order`,
      [req.params.jobId]
    )

    const [media] = await db.execute<RowDataPacket[]>(
      `SELECT id, media_type, title, description, file_url, sort_order
       FROM bmi_company_media WHERE tenant_id = ? ORDER BY media_type ASC, sort_order ASC LIMIT 12`,
      [(rows[0] as any).tenant_id]
    )

    let achievements: any[] = []
    try {
      const raw = (rows[0] as any).achievements_json
      achievements = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
    } catch { achievements = [] }

    res.json({ success: true, data: { ...rows[0], achievements_json: achievements, questions, company_media: media } })
  } catch (err) { next(err) }
})

// ─── APPLY TO JOB ────────────────────────────────────────────
portalRouter.post('/jobs/:jobId/apply', requireCandidate, async (req: any, res, next) => {
  try {
    const { jobId } = req.params
    const candidateId = req.candidate.sub
    const { answers } = req.body as { answers?: { question_id: string; answer_text: string }[] }

    const [jobRows] = await db.execute<RowDataPacket[]>(
      `SELECT j.id, j.title, j.status, j.tenant_id, t.company_name
       FROM bmi_job j JOIN bmi_tenant t ON t.id = j.tenant_id
       WHERE j.id = ? AND j.status = 'open' AND t.is_active = 1`,
      [jobId]
    )
    if (!jobRows[0]) return res.status(404).json({ success: false, message: 'Job not found' })
    if (jobRows[0].status !== 'open') return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' })

    // Use the job's own tenant_id so the application shows up in the correct client's dashboard
    const jobTenantId = jobRows[0].tenant_id

    const [dup] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_application WHERE job_id = ? AND candidate_id = ?',
      [jobId, candidateId]
    )
    if (dup.length > 0) return res.status(409).json({ success: false, message: 'You have already applied for this job' })

    const appId = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_application
        (id, tenant_id, job_id, candidate_id, current_stage_name, status, applied_at)
       VALUES (?, ?, ?, ?, 'Application Received', 'active', NOW())`,
      [appId, jobTenantId, jobId, candidateId]
    )

    // Save screening answers
    if (answers && answers.length > 0) {
      for (const ans of answers) {
        const [qRows] = await db.execute<RowDataPacket[]>(
          'SELECT question FROM bmi_job_question WHERE id = ? AND job_id = ?',
          [ans.question_id, jobId]
        )
        if (!qRows[0]) continue
        await db.execute(
          `INSERT INTO bmi_application_answer
            (id, tenant_id, application_id, question_id, question_text, answer_text)
           VALUES (UUID(), ?, ?, ?, ?, ?)`,
          [jobTenantId, appId, ans.question_id, qRows[0].question, ans.answer_text]
        )
      }
    }

    // Trigger evaluation engine (non-blocking)
    evaluateApplication(appId).catch(() => {})

    // Check if job has a linked assessment WITH questions
    const [assessRows] = await db.execute<RowDataPacket[]>(
      `SELECT id, title, time_limit_mins, total_marks, passing_score, questions
       FROM bmi_assessment WHERE job_id = ? AND is_active = 1 LIMIT 1`,
      [jobId]
    )

    let assessmentData: any = null
    if (assessRows[0]) {
      // Only invite if the assessment actually has questions
      let qCount = 0
      try {
        const qs = typeof assessRows[0].questions === 'string'
          ? JSON.parse(assessRows[0].questions)
          : (assessRows[0].questions ?? [])
        qCount = Array.isArray(qs) ? qs.length : 0
      } catch { qCount = 0 }

      if (qCount > 0) {
        const inviteToken = crypto.randomBytes(32).toString('hex')
        await db.execute(
          `INSERT INTO bmi_candidate_assessment
           (id, tenant_id, assessment_id, application_id, candidate_id, status, invite_token, total_marks, created_at)
           VALUES (UUID(), ?, ?, ?, ?, 'invited', ?, ?, NOW())`,
          [jobTenantId, assessRows[0].id, appId, candidateId, inviteToken, assessRows[0].total_marks ?? 0]
        )
        assessmentData = {
          required: true,
          token: inviteToken,
          title: assessRows[0].title,
          time_limit_mins: assessRows[0].time_limit_mins,
        }
      }
    }

    // If no linked assessment (or it had no questions), try auto-generate from question bank
    if (!assessmentData) {
      const { autoGenerateAssessment } = await import('../../services/auto-assessment.service.js')
      const autoResult = await autoGenerateAssessment(appId, jobId, jobTenantId, candidateId)
      if (autoResult.invite_token) {
        assessmentData = {
          required: true,
          token: autoResult.invite_token,
          title: 'Auto Assessment',
          time_limit_mins: 30,
        }
      }
    }

    // Send confirmation email
    const [candRows] = await db.execute<RowDataPacket[]>(
      'SELECT full_name, email FROM bmi_candidate WHERE id = ?',
      [candidateId]
    )
    if (candRows[0]?.email) {
      sendApplicationConfirmationEmail(
        candRows[0].email, candRows[0].full_name, jobRows[0].title, jobRows[0].company_name
      ).catch(() => {})
    }

    res.status(201).json({
      success: true,
      message: assessmentData
        ? `Application submitted! Please complete the "${assessmentData.title}" assessment.`
        : 'Application submitted successfully!',
      data: { application_id: appId, assessment: assessmentData }
    })
  } catch (err) { next(err) }
})

// ─── MY APPLICATIONS ─────────────────────────────────────────
portalRouter.get('/applications', requireCandidate, async (req: any, res, next) => {
  try {
    const [apps] = await db.execute<RowDataPacket[]>(
      `SELECT a.id, a.status, a.current_stage_name, a.ai_match_score, a.applied_at,
              a.interview_slot_at, a.meeting_link,
              j.title AS job_title, j.job_type, j.work_mode,
              t.company_name,
              d.name AS department_name,
              l.city AS location_city,
              ca.status AS assessment_status,
              ca.invite_token AS assessment_token,
              ca.percentage AS assessment_score,
              ass.title AS assessment_title,
              c.profile_completion,
              c.intro_score,
              c.intro_transcript
       FROM bmi_application a
       JOIN bmi_job         j ON j.id = a.job_id
       JOIN bmi_tenant      t ON t.id = j.tenant_id
       LEFT JOIN bmi_department           d   ON d.id = j.department_id
       LEFT JOIN bmi_location             l   ON l.id = j.location_id
       LEFT JOIN bmi_candidate_assessment ca  ON ca.application_id = a.id
       LEFT JOIN bmi_assessment           ass ON ass.id = ca.assessment_id
       LEFT JOIN bmi_candidate            c   ON c.id = a.candidate_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`,
      [req.candidate.sub]
    )

    // Compute gate status per application
    const enriched = (apps as any[]).map(app => {
      const gate1 = Number(app.profile_completion ?? 0) >= 95
      const gate2 = app.assessment_status === 'completed' && Number(app.assessment_score ?? 0) >= 80
      const gate3 = Number(app.intro_score ?? 0) >= 80
      return {
        ...app,
        gate1_passed: gate1,
        gate2_passed: gate2,
        gate3_passed: gate3,
        all_gates_passed: gate1 && gate2 && gate3,
      }
    })

    res.json({ success: true, data: enriched })
  } catch (err) { next(err) }
})

// ─── IN-APP NOTIFICATIONS ────────────────────────────────────
portalRouter.get('/notifications', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, subject, body, status, reference_id, reference_type, created_at
       FROM bmi_notification_log
       WHERE channel = 'in_app' AND recipient_type = 'candidate' AND recipient_id = ?
       ORDER BY created_at DESC LIMIT 30`,
      [req.candidate.sub]
    )
    const unread = rows.filter((r: any) => r.status === 'sent').length
    res.json({ success: true, data: { notifications: rows, unread } })
  } catch (err) { next(err) }
})

portalRouter.post('/notifications/read-all', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      `UPDATE bmi_notification_log SET status = 'delivered'
       WHERE channel = 'in_app' AND recipient_type = 'candidate' AND recipient_id = ? AND status = 'sent'`,
      [req.candidate.sub]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ─── FORGOT PASSWORD — Send OTP ───────────────────────────────
portalRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    const emailHash = sha256(email)
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, full_name, email FROM bmi_candidate WHERE email_hash = ? AND tenant_id = ?',
      [emailHash, DEMO_TENANT]
    )

    if (!rows[0]) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' })
    }

    const candidate = rows[0]
    const otp       = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash   = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.execute('DELETE FROM bmi_candidate_portal_session WHERE candidate_id = ?', [candidate.id])
    await db.execute(
      `INSERT INTO bmi_candidate_portal_session (id, candidate_id, tenant_id, otp_hash, otp_expires_at)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [candidate.id, DEMO_TENANT, otpHash, expiresAt]
    )

    await sendOTPEmail(candidate.email, candidate.full_name, otp)

    res.json({ success: true, message: 'OTP sent to your registered email address.' })
  } catch (err) { next(err) }
})

// ─── RESET PASSWORD — Verify OTP + Set New Password ──────────
portalRouter.post('/reset-password', async (req, res, next) => {
  try {
    const body = z.object({
      email:        z.string().email(),
      otp:          z.string().length(6),
      new_password: z.string().min(6, 'Password must be at least 6 characters'),
    }).parse(req.body)

    const emailHash = sha256(body.email)
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, full_name FROM bmi_candidate WHERE email_hash = ? AND tenant_id = ?',
      [emailHash, DEMO_TENANT]
    )
    if (!rows[0]) {
      const e: any = new Error('Invalid or expired OTP.'); e.status = 400; throw e
    }

    const candidate = rows[0]
    const [sessions] = await db.execute<RowDataPacket[]>(
      'SELECT id, otp_hash, otp_expires_at FROM bmi_candidate_portal_session WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [candidate.id]
    )

    const session = sessions[0]
    if (!session) {
      const e: any = new Error('No OTP request found. Please request a new OTP.'); e.status = 400; throw e
    }
    if (new Date(session.otp_expires_at) < new Date()) {
      await db.execute('DELETE FROM bmi_candidate_portal_session WHERE id = ?', [session.id])
      const e: any = new Error('OTP has expired. Please request a new one.'); e.status = 400; throw e
    }

    const valid = await bcrypt.compare(body.otp, session.otp_hash)
    if (!valid) {
      const e: any = new Error('Incorrect OTP. Please check and try again.'); e.status = 400; throw e
    }

    const newHash = await bcrypt.hash(body.new_password, 10)
    await db.execute('UPDATE bmi_candidate SET password_hash = ? WHERE id = ?', [newHash, candidate.id])
    await db.execute('DELETE FROM bmi_candidate_portal_session WHERE candidate_id = ?', [candidate.id])

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' })
  } catch (err) { next(err) }
})

// ─── SAVED JOBS ───────────────────────────────────────────────
portalRouter.get('/saved-jobs', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT sj.id AS saved_id, sj.saved_at,
              j.id, j.title, j.job_type, j.work_mode, j.status,
              j.experience_min_years, j.experience_max_years,
              j.salary_min, j.salary_max, j.skills_required,
              j.posted_at, j.closes_at,
              t.company_name, t.logo_url AS company_logo_url,
              l.city AS location_city, l.state AS location_state
       FROM bmi_saved_job sj
       JOIN bmi_job j ON j.id = sj.job_id
       JOIN bmi_tenant t ON t.id = j.tenant_id
       LEFT JOIN bmi_location l ON l.id = j.location_id
       WHERE sj.candidate_id = ?
       ORDER BY sj.saved_at DESC`,
      [req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

portalRouter.post('/saved-jobs', requireCandidate, async (req: any, res, next) => {
  try {
    const { job_id } = req.body
    if (!job_id) return res.status(400).json({ success: false, message: 'job_id is required' })
    await db.execute(
      `INSERT IGNORE INTO bmi_saved_job (id, candidate_id, job_id) VALUES (UUID(), ?, ?)`,
      [req.candidate.sub, job_id]
    )
    res.status(201).json({ success: true, message: 'Job saved' })
  } catch (err) { next(err) }
})

portalRouter.delete('/saved-jobs/:jobId', requireCandidate, async (req: any, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_saved_job WHERE candidate_id = ? AND job_id = ?',
      [req.candidate.sub, req.params.jobId]
    )
    res.json({ success: true, message: 'Job removed from saved' })
  } catch (err) { next(err) }
})

// ═══════════════════════════════════════════════════════════════
// INTERVIEW SCHEDULING — Candidate schedules interview time
// ═══════════════════════════════════════════════════════════════

// GET /api/v1/portal/applications/:id/interviews — Get interviews for this application
portalRouter.get('/applications/:id/interviews', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.id, i.round_name, i.interview_type, i.mode,
              i.scheduled_at, i.duration_mins, i.meeting_link,
              i.status, i.scheduling_status,
              i.candidate_proposed_at, i.client_acknowledged_at,
              i.candidate_notes, i.mediator_notes,
              j.title AS job_title,
              t.company_name
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_job j ON j.id = i.job_id
       JOIN bmi_tenant t ON t.id = i.tenant_id
       WHERE i.application_id = ? AND i.candidate_id = ?
       ORDER BY i.created_at DESC`,
      [req.params.id, req.candidate.sub]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// POST /api/v1/portal/applications/:id/schedule-interview — Candidate proposes interview time
portalRouter.post('/applications/:id/schedule-interview', requireCandidate, async (req: any, res, next) => {
  try {
    const { proposed_at, notes } = req.body
    if (!proposed_at) return res.status(400).json({ success: false, message: 'proposed_at (datetime) is required' })

    // Find the interview that's awaiting candidate scheduling
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.id, i.scheduling_status
       FROM bmi_interview i
       WHERE i.application_id = ? AND i.candidate_id = ?
         AND i.scheduling_status = 'pending_candidate'
       ORDER BY i.created_at ASC LIMIT 1`,
      [req.params.id, req.candidate.sub]
    )

    let interviewId: string
    if (rows[0]) {
      // Update existing interview
      interviewId = rows[0].id
      await db.execute(
        `UPDATE bmi_interview SET
          scheduling_status = 'candidate_scheduled',
          candidate_proposed_at = ?,
          candidate_notes = ?,
          scheduled_at = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [proposed_at, notes ?? null, proposed_at, interviewId]
      )
    } else {
      // Check application belongs to this candidate
      const [appRows] = await db.execute<RowDataPacket[]>(
        `SELECT a.id, a.job_id, a.tenant_id, j.title
         FROM bmi_application a
         JOIN bmi_job j ON j.id = a.job_id
         WHERE a.id = ? AND a.candidate_id = ?`,
        [req.params.id, req.candidate.sub]
      )
      if (!appRows[0]) return res.status(404).json({ success: false, message: 'Application not found' })

      // Create new interview
      interviewId = crypto.randomUUID()
      await db.execute(
        `INSERT INTO bmi_interview
          (id, tenant_id, application_id, candidate_id, job_id,
           round_name, interview_type, mode, scheduled_at, duration_mins,
           scheduling_status, candidate_proposed_at, candidate_notes,
           status, created_by, created_at)
         VALUES (UUID(), ?, ?, ?, ?,
          'Technical Round', 'video', 'online', ?, 60,
          'candidate_scheduled', ?, ?,
          'scheduled', ?, NOW())`,
        [
          appRows[0].tenant_id, req.params.id, req.candidate.sub, appRows[0].job_id,
          proposed_at, proposed_at, notes ?? null, req.candidate.sub,
        ]
      )
    }

    // Notify client about scheduling
    const [appInfo] = await db.execute<RowDataPacket[]>(
      `SELECT t.id AS tenant_id, t.company_name, j.title AS job_title, c.full_name
       FROM bmi_application a
       JOIN bmi_job j ON j.id = a.job_id
       JOIN bmi_tenant t ON t.id = a.tenant_id
       JOIN bmi_candidate c ON c.id = a.candidate_id
       WHERE a.id = ?`,
      [req.params.id]
    )
    if (appInfo[0]) {
      const info = appInfo[0] as any
      await db.execute(
        `INSERT INTO bmi_notification_log
          (id, tenant_id, channel, recipient_type, recipient_id, subject, body,
           event_key, reference_id, reference_type, status, created_at)
         VALUES (UUID(), ?, 'in_app', 'admin', 'all',
          ?, ?, 'interview_scheduled', ?, 'interview', 'sent', NOW())`,
        [
          info.tenant_id,
          `Interview Scheduled: ${info.job_title}`,
          `Candidate ${info.full_name} has scheduled an interview for "${info.job_title}". Please acknowledge in your portal.`,
          interviewId,
        ]
      )
    }

    res.status(201).json({
      success: true,
      message: 'Interview time proposed. Awaiting client acknowledgment.',
      data: { interview_id: interviewId }
    })
  } catch (err) { next(err) }
})

// GET /api/v1/portal/interviews/:id — Get interview detail
portalRouter.get('/interviews/:id', requireCandidate, async (req: any, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.*,
              j.title AS job_title,
              t.company_name, t.logo_url
       FROM bmi_interview i
       JOIN bmi_application a ON a.id = i.application_id
       JOIN bmi_job j ON j.id = i.job_id
       JOIN bmi_tenant t ON t.id = i.tenant_id
       WHERE i.id = ? AND i.candidate_id = ?`,
      [req.params.id, req.candidate.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Interview not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ─── CANDIDATE FEEDBACK ───────────────────────────────────────
portalRouter.post('/feedback', requireCandidate, async (req: any, res, next) => {
  try {
    const { feedback_type = 'other', rating, message, page_context } = req.body
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' })

    const [candRows] = await db.execute<RowDataPacket[]>(
      'SELECT full_name, email FROM bmi_candidate WHERE id = ?', [req.candidate.sub]
    )
    const cand = candRows[0] as any

    // Simple keyword-based sentiment
    const lower = message.toLowerCase()
    const positiveWords = ['great','good','excellent','amazing','love','helpful','awesome','fantastic','perfect','thank']
    const negativeWords = ['bad','terrible','broken','issue','error','fail','wrong','problem','bug','frustrated','hate','slow']
    const posScore = positiveWords.filter(w => lower.includes(w)).length
    const negScore = negativeWords.filter(w => lower.includes(w)).length
    const sentiment = posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'neutral'

    await db.execute(
      `INSERT INTO bmi_candidate_feedback
        (id, candidate_id, candidate_name, candidate_email, feedback_type, rating, message, sentiment, page_context)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.candidate.sub, cand?.full_name ?? null, cand?.email ?? null,
        feedback_type, rating ?? null, message.trim(), sentiment, page_context ?? null,
      ]
    )
    res.status(201).json({ success: true, message: 'Thank you for your feedback!' })
  } catch (err) { next(err) }
})

// ─── SHORT INTRO SUBMISSION & AI SCORING ─────────────────────
portalRouter.post('/me/intro', requireCandidate, async (req: any, res, next) => {
  try {
    const { intro_text } = z.object({ intro_text: z.string().min(20).max(3000) }).parse(req.body)

    let score = 0
    let feedback = ''

    if (env.ANTHROPIC_API_KEY) {
      try {
        const { default: axios } = await import('axios')
        const resp = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 256,
            messages: [{
              role: 'user',
              content: `You are an HR evaluator scoring a job candidate self-introduction for the Indian job market. English may be the candidate's second or third language, so prioritise communication effectiveness over perfect grammar.

Score on 0-100:
- Communication clarity and understandability (35 points) — can the listener understand what the candidate is saying?
- Professional content and substance (30 points) — do they mention relevant skills, experience, roles, or value they bring?
- Confidence and natural flow (20 points) — does it feel genuine and coherent?
- Language and grammar (15 points) — deduct points ONLY when errors make meaning unclear. Minor errors and common Indian English expressions ("I am having X years experience", "I have done my graduation", "I am good in coding") are perfectly acceptable.

Be generous — assess communication ability, not English proficiency perfection.

Candidate intro:
"${intro_text}"

Respond ONLY with valid JSON: {"score": <number 0-100>, "feedback": "<1-2 sentence constructive feedback>"}`
            }],
          },
          {
            headers: {
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            timeout: 15000,
          }
        )
        const text = resp.data?.content?.[0]?.text ?? ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          score    = Math.min(100, Math.max(0, Number(parsed.score ?? 0)))
          feedback = parsed.feedback ?? ''
        }
      } catch (aiErr: any) {
        console.warn('[intro AI] scoring failed, using heuristic:', aiErr.message)
      }
    }

    // Heuristic fallback if AI unavailable or returned 0
    if (score === 0) {
      const words = intro_text.trim().split(/\s+/).length
      const sentences = (intro_text.match(/[.!?]+/g) ?? []).length
      const hasProfessional = /experience|skill|role|year|project|team|work|develop|manage|design|build|create|achiev/i.test(intro_text)
      score = Math.min(100,
        (words >= 30 ? 28 : Math.floor(words * 0.9)) +
        (sentences >= 2 ? 22 : sentences * 10) +
        (hasProfessional ? 28 : 14) +
        (intro_text.length >= 100 ? 22 : Math.floor(intro_text.length / 4.5))
      )
      feedback = score >= 80
        ? 'Good introduction — you communicated your background clearly.'
        : score >= 60
        ? 'Decent introduction. Try mentioning specific skills, years of experience, or key achievements.'
        : 'Add more detail about your skills, experience, and what value you bring to employers.'
    }

    await db.execute(
      'UPDATE bmi_candidate SET intro_score = ?, intro_transcript = ?, intro_feedback = ? WHERE id = ?',
      [score, intro_text, feedback, req.candidate.sub]
    )

    // Check if all gates now pass and fire unlock email
    if (score >= 80) {
      const [cRows] = await db.execute<RowDataPacket[]>(
        `SELECT c.profile_completion, c.email, c.full_name,
                MAX(ca.percentage) AS best_assessment
         FROM bmi_candidate c
         LEFT JOIN bmi_application a ON a.candidate_id = c.id
         LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id AND ca.status = 'completed'
         WHERE c.id = ? GROUP BY c.id`,
        [req.candidate.sub]
      )
      const cRow = cRows[0] as any
      if (cRow &&
          Number(cRow.profile_completion ?? 0) >= 95 &&
          Number(cRow.best_assessment ?? 0) >= 80) {
        const { sendInterviewUnlockEmail } = await import('../../services/email.service.js')
        sendInterviewUnlockEmail(cRow.email, cRow.full_name, 'your applied position', 'the company').catch(() => {})
      }
    }

    res.json({ success: true, data: { score, feedback } })
  } catch (err) { next(err) }
})

// ─── CANDIDATE SELECTS INTERVIEW SLOT ────────────────────────
portalRouter.post('/applications/:id/select-slot', requireCandidate, async (req: any, res, next) => {
  try {
    const { slot_at } = z.object({ slot_at: z.string() }).parse(req.body)
    const slotDate = new Date(slot_at)
    if (isNaN(slotDate.getTime())) {
      const e: any = new Error('Invalid date'); e.status = 400; throw e
    }

    // Verify application belongs to this candidate
    const [appRows] = await db.execute<RowDataPacket[]>(
      `SELECT a.id, j.title AS job_title, t.company_name,
              ca.percentage AS assessment_score, ca.status AS assessment_status,
              c.profile_completion, c.intro_score, c.email, c.full_name
       FROM bmi_application a
       JOIN bmi_job j ON j.id = a.job_id
       JOIN bmi_tenant t ON t.id = j.tenant_id
       JOIN bmi_candidate c ON c.id = a.candidate_id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id AND ca.status = 'completed'
       WHERE a.id = ? AND a.candidate_id = ?`,
      [req.params.id, req.candidate.sub]
    )
    const app = appRows[0] as any
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    // Validate all gates pass
    const gate1 = Number(app.profile_completion ?? 0) >= 95
    const gate2 = app.assessment_status === 'completed' && Number(app.assessment_score ?? 0) >= 80
    const [cInfo] = await db.execute<RowDataPacket[]>('SELECT intro_score FROM bmi_candidate WHERE id = ?', [req.candidate.sub])
    const gate3 = Number((cInfo[0] as any)?.intro_score ?? 0) >= 80
    if (!gate1 || !gate2 || !gate3) {
      return res.status(403).json({ success: false, message: 'Complete all 3 gates before scheduling' })
    }

    await db.execute(
      'UPDATE bmi_application SET interview_slot_at = ? WHERE id = ?',
      [slotDate, req.params.id]
    )

    // Notify client via email
    const [clientRows] = await db.execute<RowDataPacket[]>(
      `SELECT u.email, u.full_name FROM bmi_user u
       JOIN bmi_job j ON j.tenant_id = u.tenant_id
       JOIN bmi_application a ON a.job_id = j.id
       WHERE a.id = ? AND u.role = 'admin' LIMIT 1`,
      [req.params.id]
    )
    if (clientRows[0]) {
      const { sendInterviewScheduleEmail } = await import('../../services/email.service.js')
      const clientUser = clientRows[0] as any
      sendInterviewScheduleEmail(
        clientUser.email,
        clientUser.full_name,
        `Candidate for ${app.job_title}`,
        slotDate.toLocaleDateString('en-IN', { dateStyle: 'full' }),
        slotDate.toLocaleTimeString('en-IN', { timeStyle: 'short' }),
        'Candidate-proposed slot'
      ).catch(() => {})
    }

    res.json({ success: true, message: 'Interview slot selected' })
  } catch (err) { next(err) }
})

// ─── PUBLIC COMPANY PROFILE (for candidates viewing a job) ────
portalRouter.get('/company/:tenantId', async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT company_name, company_tagline, about_company, culture_description,
              achievements_json, logo_url, website, industry, company_size,
              city, state
       FROM bmi_tenant WHERE id = ? AND is_active = 1`,
      [req.params.tenantId]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Company not found' })

    const [media] = await db.execute<RowDataPacket[]>(
      `SELECT id, media_type, title, description, file_url, sort_order
       FROM bmi_company_media WHERE tenant_id = ? ORDER BY media_type ASC, sort_order ASC`,
      [req.params.tenantId]
    )

    const row = rows[0] as any
    let achievements: any[] = []
    try {
      achievements = typeof row.achievements_json === 'string'
        ? JSON.parse(row.achievements_json) : (row.achievements_json ?? [])
    } catch { achievements = [] }

    res.json({ success: true, data: { ...row, achievements_json: achievements, media } })
  } catch (err) { next(err) }
})
