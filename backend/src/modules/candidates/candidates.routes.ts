import { Router } from 'express'
import { createHash } from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.js'
import { z } from 'zod'

export const candidatesRouter = Router()
candidatesRouter.use(requireAuth)

const createCandidateSchema = z.object({
  full_name:           z.string().min(2),
  mobile:              z.string().min(10).max(15),
  email:               z.string().email().optional(),
  gender:              z.enum(['male','female','other','prefer_not_to_say']).optional(),
  date_of_birth:       z.string().optional(),
  current_location:    z.string().optional(),
  current_company:     z.string().optional(),
  current_designation: z.string().optional(),
  experience_years:    z.number().optional(),
  notice_period_days:  z.number().int().optional(),
  current_salary:      z.number().optional(),
  expected_salary:     z.number().optional(),
  source:              z.enum(['job_board','referral','linkedin','walk_in','agency','campus','direct','other']).default('direct'),
  source_detail:       z.string().optional(),
})

// GET /api/v1/candidates
candidatesRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { search, source, limit = 50, offset = 0 } = req.query
    let sql = `SELECT * FROM bmi_candidate WHERE tenant_id = ?`
    const params: any[] = [req.user!.tenant_id]
    if (search) { sql += ` AND (full_name LIKE ? OR mobile LIKE ? OR email LIKE ?)`; const s = `%${search}%`; params.push(s, s, s) }
    if (source) { sql += ` AND source = ?`; params.push(source) }
    sql += ` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/candidates/:id
candidatesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const tid = req.user!.tenant_id

    const [cRows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate WHERE id = ? AND tenant_id = ?`, [id, tid]
    )
    if (!cRows[0]) return res.status(404).json({ success: false, message: 'Candidate not found' })
    const candidate = cRows[0]

    const [eduRows]  = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate_education WHERE candidate_id = ? ORDER BY sort_order, passing_year DESC`, [id]
    )
    const [expRows]  = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate_experience WHERE candidate_id = ? ORDER BY sort_order, joining_date DESC`, [id]
    )
    const [sklRows]  = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate_skill WHERE candidate_id = ? ORDER BY sort_order`, [id]
    )
    const [certRows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate_certification WHERE candidate_id = ? ORDER BY sort_order`, [id]
    )
    const [appRows]  = await db.execute<RowDataPacket[]>(
      `SELECT a.id, a.current_stage_name, a.status, a.applied_at,
              j.title AS job_title, j.job_code,
              ev.total_score, ev.recommendation, ev.profile_score, ev.education_score,
              ev.experience_score, ev.skill_score, ev.resume_score, ev.assessment_score,
              ca.status AS assessment_status, ca.percentage AS assessment_pct, ca.passed AS assessment_passed
       FROM bmi_application a
       JOIN bmi_job j ON j.id = a.job_id
       LEFT JOIN bmi_evaluation_score ev ON ev.application_id = a.id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
       WHERE a.candidate_id = ? AND a.tenant_id = ?
       ORDER BY a.applied_at DESC`, [id, tid]
    )

    res.json({
      success: true,
      data: {
        ...candidate,
        education:      eduRows,
        experience:     expRows,
        skills:         sklRows,
        certifications: certRows,
        applications:   appRows,
      }
    })
  } catch (err) { next(err) }
})

// POST /api/v1/candidates
candidatesRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const input = createCandidateSchema.parse(req.body)
    const code = `C-${Date.now()}`
    const mobileHash = createHash('sha256').update(input.mobile).digest('hex')
    const emailHash  = input.email ? createHash('sha256').update(input.email).digest('hex') : null

    await db.execute(
      `INSERT INTO bmi_candidate (id, tenant_id, candidate_code, full_name, mobile, mobile_hash,
        email, email_hash, gender, date_of_birth, current_location, current_company,
        current_designation, experience_years, notice_period_days, current_salary,
        expected_salary, source, source_detail, created_by)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.tenant_id, code, input.full_name, input.mobile, mobileHash,
       input.email ?? null, emailHash, input.gender ?? null, input.date_of_birth ?? null,
       input.current_location ?? null, input.current_company ?? null,
       input.current_designation ?? null, input.experience_years ?? null,
       input.notice_period_days ?? null, input.current_salary ?? null,
       input.expected_salary ?? null, input.source, input.source_detail ?? null,
       req.user!.id]
    )
    res.status(201).json({ success: true, message: 'Candidate created', data: { candidate_code: code } })
  } catch (err) { next(err) }
})
