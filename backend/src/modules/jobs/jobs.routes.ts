import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { sendJobPostedEmail } from '../../services/email.service.js'
import { z } from 'zod'

export const jobsRouter = Router()
jobsRouter.use(requireAuth)

const createJobSchema = z.object({
  title:                z.string().min(2),
  department_id:        z.string().optional(),
  location_id:          z.string().optional(),
  job_type:             z.enum(['full_time','part_time','contract','internship','temp']).default('full_time'),
  work_mode:            z.enum(['onsite','remote','hybrid']).default('onsite'),
  experience_min_years: z.coerce.number().min(0).default(0),
  experience_max_years: z.coerce.number().optional(),
  salary_min:           z.coerce.number().optional(),
  salary_max:           z.coerce.number().optional(),
  headcount:            z.coerce.number().int().min(1).default(1),
  description:          z.string().optional(),
  requirements:         z.string().optional(),
  skills_required:      z.array(z.string()).optional(),
  priority:             z.enum(['low','medium','high','urgent']).default('medium'),
  closes_at:            z.string().optional(),
})

// GET /api/v1/jobs/departments
jobsRouter.get('/departments', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name FROM bmi_department WHERE tenant_id = ? ORDER BY name`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/jobs/locations
jobsRouter.get('/locations', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, city, state, country FROM bmi_location WHERE tenant_id = ? ORDER BY city`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/jobs
jobsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query
    let sql = `SELECT j.*, d.name AS department_name, l.city AS location_city
               FROM bmi_job j
               LEFT JOIN bmi_department d ON d.id = j.department_id
               LEFT JOIN bmi_location l ON l.id = j.location_id
               WHERE j.tenant_id = ?`
    const params: any[] = [req.user!.tenant_id]
    if (status) { sql += ` AND j.status = ?`; params.push(status) }
    if (priority) { sql += ` AND j.priority = ?`; params.push(priority) }
    sql += ` ORDER BY j.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows, total: rows.length })
  } catch (err) { next(err) }
})

// GET /api/v1/jobs/:id
jobsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT j.*, d.name AS department_name, l.city AS location_city
       FROM bmi_job j
       LEFT JOIN bmi_department d ON d.id = j.department_id
       LEFT JOIN bmi_location l ON l.id = j.location_id
       WHERE j.id = ? AND j.tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// POST /api/v1/jobs
jobsRouter.post('/', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = createJobSchema.parse(req.body)
    const jobCode = `JOB-${Date.now()}`
    const skillsJson = input.skills_required?.length ? JSON.stringify(input.skills_required) : null

    await db.execute(
      `INSERT INTO bmi_job (id, tenant_id, job_code, title, department_id, location_id, job_type,
        work_mode, experience_min_years, experience_max_years, salary_min, salary_max,
        headcount, description, requirements, skills_required, priority, closes_at,
        created_by, status, posted_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
      [req.user!.tenant_id, jobCode, input.title, input.department_id ?? null,
       input.location_id ?? null, input.job_type, input.work_mode,
       input.experience_min_years, input.experience_max_years ?? null,
       input.salary_min ?? null, input.salary_max ?? null, input.headcount,
       input.description ?? null, input.requirements ?? null, skillsJson, input.priority,
       input.closes_at ?? null, req.user!.id]
    )

    // Send email confirmation to the job creator (non-blocking)
    const [userRows] = await db.execute<RowDataPacket[]>(
      'SELECT full_name, email FROM bmi_user WHERE id = ?', [req.user!.id]
    )
    if (userRows[0]?.email) {
      sendJobPostedEmail(
        userRows[0].email, userRows[0].full_name,
        input.title, jobCode, input.job_type, input.priority
      ).catch(() => {})
    }

    res.status(201).json({
      success: true,
      message: `Job "${input.title}" posted successfully! Confirmation sent to ${userRows[0]?.email ?? 'your email'}.`,
      data: { job_code: jobCode }
    })
  } catch (err) { next(err) }
})

// GET /api/v1/jobs/:id/applications
jobsRouter.get('/:id/applications', async (req: AuthRequest, res, next) => {
  try {
    const [apps] = await db.execute<RowDataPacket[]>(
      `SELECT a.id, a.status, a.current_stage_name, a.applied_at, a.notes,
              c.id AS candidate_id, c.full_name, c.email, c.mobile,
              c.current_designation, c.profile_photo_url,
              c.experience_years, c.current_location,
              ev.total_score, ev.recommendation
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       LEFT JOIN bmi_evaluation_score ev ON ev.application_id = a.id
       WHERE a.job_id = ? AND a.tenant_id = ?
       ORDER BY a.applied_at DESC`,
      [req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, data: apps })
  } catch (err) { next(err) }
})

// PATCH /api/v1/jobs/:id/status
jobsRouter.patch('/:id/status', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['open','paused','closed','cancelled']) }).parse(req.body)
    await db.execute(
      `UPDATE bmi_job SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [status, req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: `Job ${status}` })
  } catch (err) { next(err) }
})
