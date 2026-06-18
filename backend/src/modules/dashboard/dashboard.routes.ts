import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.js'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

// GET /api/v1/dashboard/stats
dashboardRouter.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id

    const [[activeJobs], [totalCandidates], [appStats], [interviewStats], [offerStats], [evalStats]] = await Promise.all([
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM bmi_job WHERE tenant_id = ? AND status = 'open'`, [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM bmi_candidate WHERE tenant_id = ?`, [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS total_applications,
           SUM(CASE WHEN applied_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS this_week
         FROM bmi_application WHERE tenant_id = ?`, [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN DATE(scheduled_at) = CURDATE() AND status NOT IN ('cancelled','no_show') THEN 1 ELSE 0 END) AS today,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS pending
         FROM bmi_interview WHERE tenant_id = ?`, [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS sent,
           SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted
         FROM bmi_offer WHERE tenant_id = ?`, [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN ca.status = 'completed' AND a.current_stage_name = 'Assessment Pending' THEN 1 ELSE 0 END) AS pending_assessments,
           SUM(CASE WHEN a.current_stage_name = 'Shortlisted' THEN 1 ELSE 0 END) AS shortlisted
         FROM bmi_application a
         LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
         WHERE a.tenant_id = ?`, [tid]
      ),
    ])

    res.json({ success: true, data: {
      active_jobs:             Number((activeJobs[0] as any).cnt ?? 0),
      total_candidates:        Number((totalCandidates[0] as any).cnt ?? 0),
      total_applications:      Number((appStats[0] as any).total_applications ?? 0),
      applications_this_week:  Number((appStats[0] as any).this_week ?? 0),
      interviews_today:        Number((interviewStats[0] as any).today ?? 0),
      interviews_pending:      Number((interviewStats[0] as any).pending ?? 0),
      offers_sent:             Number((offerStats[0] as any).sent ?? 0),
      offers_accepted:         Number((offerStats[0] as any).accepted ?? 0),
      pending_assessments:     Number((evalStats[0] as any).pending_assessments ?? 0),
      shortlisted:             Number((evalStats[0] as any).shortlisted ?? 0),
    }})
  } catch (err) { next(err) }
})

// GET /api/v1/dashboard/funnel
dashboardRouter.get('/funnel', async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT current_stage_name AS stage, COUNT(*) AS count
       FROM bmi_application
       WHERE tenant_id = ? AND applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY current_stage_name
       ORDER BY FIELD(current_stage_name,
         'Application Received','Assessment Pending','Shortlisted',
         'Interview Scheduled','Selected','Offer Sent','Joined','Rejected') ASC`,
      [tid]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/dashboard/trend
dashboardRouter.get('/trend', async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
         CONCAT('W', WEEK(applied_at) - WEEK(DATE_SUB(NOW(), INTERVAL 4 WEEK)) + 1) AS week,
         COUNT(*) AS applications,
         SUM(CASE WHEN current_stage_name IN ('Shortlisted','Interview Scheduled','Selected','Joined') THEN 1 ELSE 0 END) AS shortlisted
       FROM bmi_application
       WHERE tenant_id = ? AND applied_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
       GROUP BY WEEK(applied_at)
       ORDER BY WEEK(applied_at) ASC`,
      [tid]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/dashboard/activity
dashboardRouter.get('/activity', async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT a.current_stage_name AS type, c.full_name AS candidate_name,
              j.title AS job_title, a.updated_at AS action_at
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       WHERE a.tenant_id = ? AND a.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY a.updated_at DESC
       LIMIT 10`,
      [tid]
    )

    const mapped = rows.map((r: any) => ({
      ...r,
      type: r.type === 'Shortlisted' ? 'shortlisted'
          : r.type === 'Rejected'    ? 'rejected'
          : r.type === 'Interview Scheduled' ? 'interview'
          : 'applied',
    }))

    res.json({ success: true, data: mapped })
  } catch (err) { next(err) }
})
