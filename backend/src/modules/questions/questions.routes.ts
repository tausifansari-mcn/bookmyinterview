import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'

export const questionsRouter = Router()

// ─── QUESTION BANK — List ─────────────────────────────────────
questionsRouter.get('/bank', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, role, difficulty, page = '1', limit = '20' } = req.query as any
    let where = 'q.tenant_id = ? AND q.is_active = 1'
    const params: any[] = [req.user!.tenant_id]

    if (category)   { where += ' AND q.job_category = ?'; params.push(category) }
    if (role)       { where += ' AND q.job_role = ?';     params.push(role) }
    if (difficulty) { where += ' AND q.difficulty_level = ?'; params.push(difficulty) }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT q.*, u.full_name AS created_by_name
       FROM bmi_job_question_bank q
       LEFT JOIN bmi_user u ON u.id = q.created_by
       WHERE ${where}
       ORDER BY q.job_category, q.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_job_question_bank q WHERE ${where}`, params
    )

    res.json({ success: true, data: { questions: rows, total: (countRows[0] as any).total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ─── QUESTION BANK — Get categories ──────────────────────────
questionsRouter.get('/bank/categories', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT job_category, COUNT(*) AS count
       FROM bmi_job_question_bank WHERE tenant_id = ? AND is_active = 1
       GROUP BY job_category ORDER BY job_category`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ─── QUESTION BANK — Create ───────────────────────────────────
const bankSchema = z.object({
  job_category:     z.string().min(1).max(100),
  job_role:         z.string().max(200).optional(),
  question:         z.string().min(5),
  suggested_answer: z.string().optional(),
  question_type:    z.enum(['text','yes_no','multiple_choice','rating','file_upload']).optional(),
  options:          z.array(z.string()).optional(),
  difficulty_level: z.enum(['easy','medium','hard']).optional(),
  is_mandatory:     z.coerce.number().min(0).max(1).optional(),
})

questionsRouter.post('/bank', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const body = bankSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_job_question_bank
        (id, tenant_id, job_category, job_role, question, suggested_answer, question_type,
         options, difficulty_level, is_mandatory, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user!.tenant_id, body.job_category, body.job_role ?? null, body.question,
       body.suggested_answer ?? null, body.question_type ?? 'text',
       body.options ? JSON.stringify(body.options) : null,
       body.difficulty_level ?? 'medium', body.is_mandatory ?? 0, req.user!.id]
    )
    res.status(201).json({ success: true, message: 'Question added to bank', data: { id } })
  } catch (err) { next(err) }
})

// ─── QUESTION BANK — Update ───────────────────────────────────
questionsRouter.put('/bank/:id', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const body = bankSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_job_question_bank SET job_category=?, job_role=?, question=?, suggested_answer=?,
       question_type=?, options=?, difficulty_level=?, is_mandatory=? WHERE id = ? AND tenant_id = ?`,
      [body.job_category, body.job_role ?? null, body.question, body.suggested_answer ?? null,
       body.question_type ?? 'text', body.options ? JSON.stringify(body.options) : null,
       body.difficulty_level ?? 'medium', body.is_mandatory ?? 0, req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Question updated' })
  } catch (err) { next(err) }
})

// ─── QUESTION BANK — Delete (soft) ───────────────────────────
questionsRouter.delete('/bank/:id', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    await db.execute(
      'UPDATE bmi_job_question_bank SET is_active = 0 WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Question removed from bank' })
  } catch (err) { next(err) }
})

// ─── JOB QUESTIONS — List questions for a job ─────────────────
questionsRouter.get('/job/:jobId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_job_question WHERE job_id = ? AND tenant_id = ? ORDER BY sort_order`,
      [req.params.jobId, req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ─── JOB QUESTIONS — Add question to job ─────────────────────
const jobQSchema = z.object({
  bank_question_id: z.string().uuid().optional(),
  question:         z.string().min(5),
  suggested_answer: z.string().optional(),
  question_type:    z.enum(['text','yes_no','multiple_choice','rating','file_upload']).optional(),
  options:          z.array(z.string()).optional(),
  difficulty_level: z.enum(['easy','medium','hard']).optional(),
  is_mandatory:     z.coerce.number().min(0).max(1).optional(),
  sort_order:       z.coerce.number().optional(),
})

questionsRouter.post('/job/:jobId', requireAuth, requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const body = jobQSchema.parse(req.body)

    // Verify job belongs to tenant
    const [jobRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_job WHERE id = ? AND tenant_id = ?',
      [req.params.jobId, req.user!.tenant_id]
    )
    if (!jobRows[0]) return res.status(404).json({ success: false, message: 'Job not found' })

    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_job_question
        (id, tenant_id, job_id, bank_question_id, question, suggested_answer, question_type,
         options, difficulty_level, is_mandatory, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user!.tenant_id, req.params.jobId, body.bank_question_id ?? null, body.question,
       body.suggested_answer ?? null, body.question_type ?? 'text',
       body.options ? JSON.stringify(body.options) : null,
       body.difficulty_level ?? 'medium', body.is_mandatory ?? 0, body.sort_order ?? 0]
    )
    res.status(201).json({ success: true, message: 'Question added to job', data: { id } })
  } catch (err) { next(err) }
})

// ─── JOB QUESTIONS — Auto-load from bank ─────────────────────
questionsRouter.post('/job/:jobId/auto-load', requireAuth, requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const { job_category } = z.object({ job_category: z.string().min(1) }).parse(req.body)

    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM bmi_job_question WHERE job_id = ?',
      [req.params.jobId]
    )
    if ((existing[0] as any).cnt > 0) {
      return res.status(409).json({ success: false, message: 'This job already has questions assigned. Clear them first or add manually.' })
    }

    const [bankQ] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_job_question_bank
       WHERE tenant_id = ? AND is_active = 1
         AND (job_category = ? OR job_category = 'General')
       ORDER BY is_mandatory DESC, difficulty_level ASC
       LIMIT 10`,
      [req.user!.tenant_id, job_category]
    )

    if (bankQ.length === 0) {
      return res.json({ success: true, message: 'No matching questions found in bank.', data: { loaded: 0 } })
    }

    let loaded = 0
    for (const q of bankQ) {
      await db.execute(
        `INSERT INTO bmi_job_question
          (id, tenant_id, job_id, bank_question_id, question, suggested_answer, question_type,
           options, difficulty_level, is_mandatory, sort_order)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user!.tenant_id, req.params.jobId, q.id, q.question, q.suggested_answer,
         q.question_type, q.options, q.difficulty_level, q.is_mandatory, loaded]
      )
      loaded++
    }

    res.json({ success: true, message: `${loaded} questions auto-loaded from bank.`, data: { loaded } })
  } catch (err) { next(err) }
})

// ─── JOB QUESTIONS — Delete ───────────────────────────────────
questionsRouter.delete('/job/:jobId/question/:qId', requireAuth, requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    await db.execute(
      'DELETE FROM bmi_job_question WHERE id = ? AND job_id = ? AND tenant_id = ?',
      [req.params.qId, req.params.jobId, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Question removed from job' })
  } catch (err) { next(err) }
})
