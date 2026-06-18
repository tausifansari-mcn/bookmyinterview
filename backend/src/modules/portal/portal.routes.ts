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
  if (c.profile_photo_url)                                pct += 20
  if (c.resume_url)                                       pct += 20
  if (c.full_name && c.gender && c.date_of_birth)         pct += 15
  if (c.mobile && c.email)                                pct += 10
  if (c.edu_count > 0)                                    pct += 10
  if (c.exp_count > 0)                                    pct += 10
  if (c.skill_count > 0)                                  pct += 5
  if (c.work_preference && c.current_location)            pct += 5
  if (c.professional_summary || c.career_objective)       pct += 5
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
              ai_score, ai_summary, tags, profile_completion, created_at
       FROM bmi_candidate WHERE id = ?`,
      [req.candidate.sub]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Profile not found' })
    res.json({ success: true, data: rows[0] })
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
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
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
              c.career_objective,
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
      short_introduction:  { label: 'Short Introduction',   pct:  5, done: !!(c?.professional_summary || c?.career_objective) },
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

const certSchema = z.object({
  certification_name:    z.string().min(1).max(300),
  issuing_organization:  z.string().min(1).max(300),
  issue_date:            z.string().optional().nullable(),
  expiry_date:           z.string().optional().nullable(),
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
    const { search, job_type, work_mode, page = '1', limit = '10' } = req.query as any
    let where = `j.tenant_id = ? AND j.status = 'open'`
    const params: any[] = [DEMO_TENANT]

    if (search) { where += ` AND (j.title LIKE ? OR j.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
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
              d.name AS department_name,
              l.city AS location_city, l.state AS location_state,
              (SELECT COUNT(*) FROM bmi_job_question WHERE job_id = j.id) AS question_count
       FROM bmi_job j
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location   l ON l.id = j.location_id
       WHERE ${where}
       ORDER BY j.created_at DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    )

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_job j WHERE ${where}`, params
    )
    const total = (countRows[0] as any).total

    res.json({ success: true, data: { jobs, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ─── JOB DETAIL ──────────────────────────────────────────────
portalRouter.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT j.*, d.name AS department_name, l.city AS location_city, l.state AS location_state
       FROM bmi_job j
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location   l ON l.id = j.location_id
       WHERE j.id = ? AND j.tenant_id = ? AND j.status = 'open'`,
      [req.params.jobId, DEMO_TENANT]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Job not found' })

    const [questions] = await db.execute<RowDataPacket[]>(
      `SELECT id, question, question_type, options, is_mandatory, sort_order
       FROM bmi_job_question WHERE job_id = ? ORDER BY sort_order`,
      [req.params.jobId]
    )

    res.json({ success: true, data: { ...rows[0], questions } })
  } catch (err) { next(err) }
})

// ─── APPLY TO JOB ────────────────────────────────────────────
portalRouter.post('/jobs/:jobId/apply', requireCandidate, async (req: any, res, next) => {
  try {
    const { jobId } = req.params
    const candidateId = req.candidate.sub
    const { answers } = req.body as { answers?: { question_id: string; answer_text: string }[] }

    const [jobRows] = await db.execute<RowDataPacket[]>(
      `SELECT j.id, j.title, j.status, t.company_name
       FROM bmi_job j JOIN bmi_tenant t ON t.id = j.tenant_id
       WHERE j.id = ? AND j.tenant_id = ?`,
      [jobId, DEMO_TENANT]
    )
    if (!jobRows[0]) return res.status(404).json({ success: false, message: 'Job not found' })
    if (jobRows[0].status !== 'open') return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' })

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
      [appId, DEMO_TENANT, jobId, candidateId]
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
          [DEMO_TENANT, appId, ans.question_id, qRows[0].question, ans.answer_text]
        )
      }
    }

    // Trigger evaluation engine (non-blocking)
    evaluateApplication(appId).catch(() => {})

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
      message: `Successfully applied for ${jobRows[0].title}!`,
      data: { application_id: appId }
    })
  } catch (err) { next(err) }
})

// ─── MY APPLICATIONS ─────────────────────────────────────────
portalRouter.get('/applications', requireCandidate, async (req: any, res, next) => {
  try {
    const [apps] = await db.execute<RowDataPacket[]>(
      `SELECT a.id, a.status, a.current_stage_name, a.ai_match_score, a.applied_at,
              j.title AS job_title, j.job_type, j.work_mode,
              d.name AS department_name,
              l.city AS location_city
       FROM bmi_application a
       JOIN bmi_job         j ON j.id = a.job_id
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location   l ON l.id = j.location_id
       WHERE a.candidate_id = ? AND a.tenant_id = ?
       ORDER BY a.applied_at DESC`,
      [req.candidate.sub, DEMO_TENANT]
    )
    res.json({ success: true, data: apps })
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
