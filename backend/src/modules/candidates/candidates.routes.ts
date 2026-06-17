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
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), Number(offset))

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/candidates/:id
candidatesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_candidate WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: rows[0] })
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
