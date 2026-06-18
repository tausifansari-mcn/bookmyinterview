import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { z } from 'zod'

export const offersRouter = Router()
offersRouter.use(requireAuth)

// GET /api/v1/offers
offersRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    let sql = `
      SELECT o.id, o.offered_ctc, o.joining_date, o.valid_till, o.status, o.remarks,
             o.created_at, o.application_id, o.candidate_id, o.job_id,
             COALESCE(c.full_name, 'Unknown') AS candidate_name,
             c.email AS candidate_email,
             COALESCE(j.title, 'Unknown') AS job_title,
             j.job_code
      FROM bmi_offer o
      LEFT JOIN bmi_candidate c ON c.id = o.candidate_id
      LEFT JOIN bmi_job j ON j.id = o.job_id
      WHERE o.tenant_id = ?`
    const params: any[] = [req.user!.tenant_id]
    if (status) { sql += ' AND o.status = ?'; params.push(status) }
    sql += ` ORDER BY o.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// GET /api/v1/offers/:id
offersRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT o.*, c.full_name AS candidate_name, c.email AS candidate_email, c.mobile AS candidate_mobile,
              j.title AS job_title, j.job_code, j.department_id
       FROM bmi_offer o
       LEFT JOIN bmi_candidate c ON c.id = o.candidate_id
       LEFT JOIN bmi_job j ON j.id = o.job_id
       WHERE o.id = ? AND o.tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Offer not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// POST /api/v1/offers
offersRouter.post('/', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      application_id: z.string().uuid(),
      offered_ctc:    z.coerce.number().min(0),
      joining_date:   z.string().optional(),
      valid_till:     z.string().optional(),
      remarks:        z.string().optional(),
    }).parse(req.body)

    const [appRows] = await db.execute<RowDataPacket[]>(
      `SELECT candidate_id, job_id FROM bmi_application WHERE id = ? AND tenant_id = ?`,
      [input.application_id, req.user!.tenant_id]
    )
    if (!appRows[0]) return res.status(404).json({ success: false, message: 'Application not found' })

    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM bmi_offer WHERE application_id = ? AND tenant_id = ? AND status NOT IN ('declined','revoked')`,
      [input.application_id, req.user!.tenant_id]
    )
    if ((existing as any[]).length > 0) {
      return res.status(409).json({ success: false, message: 'Active offer already exists for this application' })
    }

    await db.execute(
      `INSERT INTO bmi_offer (id, tenant_id, application_id, candidate_id, job_id, offered_ctc, joining_date, valid_till, remarks, status, created_by)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [req.user!.tenant_id, input.application_id, appRows[0].candidate_id, appRows[0].job_id,
       input.offered_ctc, input.joining_date ?? null, input.valid_till ?? null,
       input.remarks ?? null, req.user!.id]
    )

    await db.execute(
      `UPDATE bmi_application SET current_stage_name = 'Offer Sent', updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [input.application_id, req.user!.tenant_id]
    )

    res.status(201).json({ success: true, message: 'Offer created' })
  } catch (err) { next(err) }
})

// PATCH /api/v1/offers/:id/status
offersRouter.patch('/:id/status', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['draft', 'sent', 'accepted', 'declined', 'revoked']),
    }).parse(req.body)

    const [result] = await db.execute(
      `UPDATE bmi_offer SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [status, req.params.id, req.user!.tenant_id]
    ) as any

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Offer not found' })
    res.json({ success: true, message: `Offer ${status}` })
  } catch (err) { next(err) }
})
