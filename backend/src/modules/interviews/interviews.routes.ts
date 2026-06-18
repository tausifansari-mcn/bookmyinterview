import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.js'

export const interviewsRouter = Router()
interviewsRouter.use(requireAuth)

// GET /api/v1/interviews
interviewsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, from, to } = req.query as any
    let where = 'i.tenant_id = ?'
    const params: any[] = [req.user!.tenant_id]

    if (status) { where += ' AND i.status = ?'; params.push(status) }
    if (from)   { where += ' AND i.scheduled_at >= ?'; params.push(from) }
    if (to)     { where += ' AND i.scheduled_at <= ?'; params.push(to) }

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.id, i.round_name, i.interview_type, i.mode, i.scheduled_at, i.duration_mins,
              i.location, i.meeting_link, i.status, i.feedback, i.rating, i.recommendation,
              c.full_name, c.email, c.profile_photo_url,
              j.title AS job_title, j.job_code
       FROM bmi_interview i
       JOIN bmi_candidate c ON c.id = i.candidate_id
       JOIN bmi_job j ON j.id = i.job_id
       WHERE ${where}
       ORDER BY i.scheduled_at ASC`,
      params
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})
