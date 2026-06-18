import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.js'

export const analyticsRouter = Router()
analyticsRouter.use(requireAuth)

// GET /api/v1/analytics/overview  — KPI summary cards
analyticsRouter.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id

    const [[appStats], [offerStats], [hireStats]] = await Promise.all([
      db.execute<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS total_applications,
           SUM(CASE WHEN current_stage_name IN ('Selected','Offer Sent','Joined') THEN 1 ELSE 0 END) AS advanced,
           AVG(CASE WHEN current_stage_name = 'Joined'
                 THEN DATEDIFF(updated_at, applied_at) END) AS avg_days_to_hire
         FROM bmi_application WHERE tenant_id = ?`,
        [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN status IN ('sent','accepted','declined','revoked') THEN 1 ELSE 0 END) AS sent,
           SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted
         FROM bmi_offer WHERE tenant_id = ?`,
        [tid]
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS hired_this_month
         FROM bmi_application
         WHERE tenant_id = ? AND current_stage_name = 'Joined'
           AND applied_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
        [tid]
      ),
    ])

    const a = (appStats as RowDataPacket[])[0] as any
    const o = (offerStats as RowDataPacket[])[0] as any
    const h = (hireStats as RowDataPacket[])[0] as any

    const offerSent     = Number(o?.sent ?? 0)
    const offerAccepted = Number(o?.accepted ?? 0)
    const acceptRate    = offerSent > 0 ? Math.round((offerAccepted / offerSent) * 100) : 0
    const avgDays       = a?.avg_days_to_hire != null ? Number(Number(a.avg_days_to_hire).toFixed(1)) : null

    res.json({
      success: true,
      data: {
        time_to_hire:          avgDays,
        offer_acceptance_rate: acceptRate,
        hired_this_month:      Number(h?.hired_this_month ?? 0),
        total_applications:    Number(a?.total_applications ?? 0),
      }
    })
  } catch (err) { next(err) }
})

// GET /api/v1/analytics/trend  — monthly application + hire trend (last 6 months)
analyticsRouter.get('/trend', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(applied_at, '%b') AS month,
         DATE_FORMAT(applied_at, '%Y-%m') AS month_key,
         COUNT(*) AS applied,
         SUM(CASE WHEN current_stage_name = 'Joined' THEN 1 ELSE 0 END) AS joined
       FROM bmi_application
       WHERE tenant_id = ? AND applied_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month_key, month
       ORDER BY month_key ASC`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/analytics/sources  — candidate source mix
analyticsRouter.get('/sources', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT source AS name, COUNT(*) AS value
       FROM bmi_candidate
       WHERE tenant_id = ?
       GROUP BY source
       ORDER BY value DESC`,
      [req.user!.tenant_id]
    )

    const LABEL: Record<string, string> = {
      job_board: 'Job Board', referral: 'Referral', linkedin: 'LinkedIn',
      walk_in: 'Walk-in', agency: 'Agency', campus: 'Campus',
      direct: 'Direct', other: 'Other',
    }

    const data = (rows as any[]).map(r => ({
      name:  LABEL[r.name] ?? r.name,
      value: Number(r.value),
    }))

    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// GET /api/v1/analytics/funnel  — pipeline stage distribution
analyticsRouter.get('/funnel', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT current_stage_name AS stage, COUNT(*) AS count
       FROM bmi_application
       WHERE tenant_id = ?
       GROUP BY current_stage_name
       ORDER BY FIELD(current_stage_name,
         'Application Received','Assessment Pending','Shortlisted',
         'Interview Scheduled','Selected','Offer Sent','Joined','Rejected') ASC`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})
