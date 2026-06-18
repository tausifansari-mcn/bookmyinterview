import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { sendAssessmentInviteEmail } from '../../services/email.service.js'
import { env } from '../../config/env.js'

export const assessmentsRouter = Router()

// ── Question Bank CRUD ─────────────────────────────────────────

assessmentsRouter.get('/bank', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, type, difficulty, page = '1', limit = '20' } = req.query as any
    let where = 'tenant_id = ? AND is_active = 1'
    const params: any[] = [req.user!.tenant_id]

    if (category)   { where += ' AND category = ?';        params.push(category) }
    if (type)       { where += ' AND question_type = ?';   params.push(type) }
    if (difficulty) { where += ' AND difficulty = ?';      params.push(difficulty) }

    const pg  = Math.max(1, parseInt(page) || 1)
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const off = (pg - 1) * lim

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM bmi_aq_bank WHERE ${where} ORDER BY category, created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    )
    const [[ct]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_aq_bank WHERE ${where}`, params
    )
    res.json({ success: true, data: { questions: rows, total: (ct as any).total, page: pg, limit: lim } })
  } catch (err) { next(err) }
})

assessmentsRouter.get('/bank/categories', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT category, COUNT(*) AS count
       FROM bmi_aq_bank WHERE tenant_id = ? AND is_active = 1
       GROUP BY category ORDER BY category`,
      [req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

const bankSchema = z.object({
  title:           z.string().min(5),
  question_type:   z.enum(['single_choice','multi_choice','true_false','short_text','paragraph','scenario','technical','aptitude']),
  category:        z.string().min(1).max(100).optional(),
  difficulty:      z.enum(['easy','medium','hard']).default('medium'),
  options:         z.array(z.string()).optional(),
  correct_options: z.array(z.string()).optional(),
  explanation:     z.string().optional(),
  marks:           z.coerce.number().int().min(1).default(1),
  negative_marks:  z.coerce.number().min(0).default(0),
  tags:            z.array(z.string()).optional(),
})

assessmentsRouter.post('/bank', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const body = bankSchema.parse(req.body)
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_aq_bank
        (id, tenant_id, title, question_type, category, difficulty, options, correct_options,
         explanation, marks, negative_marks, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user!.tenant_id, body.title, body.question_type,
       body.category ?? null, body.difficulty,
       body.options       ? JSON.stringify(body.options)         : null,
       body.correct_options ? JSON.stringify(body.correct_options) : null,
       body.explanation ?? null, body.marks, body.negative_marks,
       body.tags ? JSON.stringify(body.tags) : null, req.user!.id]
    )
    res.status(201).json({ success: true, message: 'Question created', data: { id } })
  } catch (err) { next(err) }
})

assessmentsRouter.put('/bank/:id', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const body = bankSchema.parse(req.body)
    await db.execute(
      `UPDATE bmi_aq_bank SET title=?, question_type=?, category=?, difficulty=?,
       options=?, correct_options=?, explanation=?, marks=?, negative_marks=?, tags=?, updated_at=NOW()
       WHERE id = ? AND tenant_id = ?`,
      [body.title, body.question_type, body.category ?? null, body.difficulty,
       body.options ? JSON.stringify(body.options) : null,
       body.correct_options ? JSON.stringify(body.correct_options) : null,
       body.explanation ?? null, body.marks, body.negative_marks,
       body.tags ? JSON.stringify(body.tags) : null, req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Question updated' })
  } catch (err) { next(err) }
})

assessmentsRouter.delete('/bank/:id', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    await db.execute(
      'UPDATE bmi_aq_bank SET is_active = 0 WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Question deleted' })
  } catch (err) { next(err) }
})

// ── Assessment Config per Job ──────────────────────────────────

assessmentsRouter.get('/job/:jobId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [[asmtRow]] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, GROUP_CONCAT(aq.aq_bank_id) AS linked_q_ids
       FROM bmi_assessment a
       LEFT JOIN bmi_assessment_question aq ON aq.assessment_id = a.id
       WHERE a.job_id = ? AND a.tenant_id = ?
       GROUP BY a.id`,
      [req.params.jobId, req.user!.tenant_id]
    )
    if (!asmtRow) return res.json({ success: true, data: null })

    const [questions] = await db.execute<RowDataPacket[]>(
      `SELECT b.*, aq.order_no, aq.marks_override, aq.id AS aq_link_id
       FROM bmi_assessment_question aq
       JOIN bmi_aq_bank b ON b.id = aq.aq_bank_id
       WHERE aq.assessment_id = ?
       ORDER BY aq.order_no`,
      [asmtRow.id]
    )

    res.json({ success: true, data: { ...asmtRow, questions } })
  } catch (err) { next(err) }
})

const asmtSchema = z.object({
  title:           z.string().min(2),
  description:     z.string().optional(),
  instructions:    z.string().optional(),
  time_limit_mins: z.coerce.number().int().min(5).default(30),
  passing_score:   z.coerce.number().min(0).max(100).default(60),
  shuffle_qs:      z.coerce.number().min(0).max(1).default(0),
  show_result:     z.coerce.number().min(0).max(1).default(1),
  question_ids:    z.array(z.string()).optional(),
})

assessmentsRouter.post('/job/:jobId', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const body = asmtSchema.parse(req.body)
    const tid = req.user!.tenant_id

    // Check job exists
    const [[job]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_job WHERE id = ? AND tenant_id = ?', [req.params.jobId, tid]
    )
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

    // Delete existing assessment for this job (replace)
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_assessment WHERE job_id = ? AND tenant_id = ?', [req.params.jobId, tid]
    )
    if (existing?.id) {
      await db.execute('DELETE FROM bmi_assessment_question WHERE assessment_id = ?', [existing.id])
      await db.execute('DELETE FROM bmi_assessment WHERE id = ?', [existing.id])
    }

    const asmtId = crypto.randomUUID()
    let totalMarks = 0

    if (body.question_ids && body.question_ids.length > 0) {
      const [qRows] = await db.execute<RowDataPacket[]>(
        `SELECT id, marks FROM bmi_aq_bank WHERE id IN (${body.question_ids.map(() => '?').join(',')}) AND tenant_id = ?`,
        [...body.question_ids, tid]
      )
      totalMarks = qRows.reduce((s, q) => s + Number(q.marks ?? 1), 0)

      await db.execute(
        `INSERT INTO bmi_assessment (id, tenant_id, job_id, title, description, instructions,
           time_limit_mins, passing_score, total_marks, shuffle_qs, show_result, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [asmtId, tid, req.params.jobId, body.title, body.description ?? null,
         body.instructions ?? null, body.time_limit_mins, body.passing_score,
         totalMarks, body.shuffle_qs, body.show_result, req.user!.id]
      )

      for (let i = 0; i < body.question_ids.length; i++) {
        await db.execute(
          'INSERT INTO bmi_assessment_question (id, assessment_id, aq_bank_id, order_no) VALUES (UUID(), ?, ?, ?)',
          [asmtId, body.question_ids[i], i + 1]
        )
      }
    } else {
      await db.execute(
        `INSERT INTO bmi_assessment (id, tenant_id, job_id, title, description, instructions,
           time_limit_mins, passing_score, total_marks, shuffle_qs, show_result, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [asmtId, tid, req.params.jobId, body.title, body.description ?? null,
         body.instructions ?? null, body.time_limit_mins, body.passing_score,
         0, body.shuffle_qs, body.show_result, req.user!.id]
      )
    }

    res.status(201).json({ success: true, message: 'Assessment configured', data: { id: asmtId } })
  } catch (err) { next(err) }
})

assessmentsRouter.delete('/job/:jobId', requireAuth, requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const [[a]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_assessment WHERE job_id = ? AND tenant_id = ?',
      [req.params.jobId, req.user!.tenant_id]
    )
    if (a?.id) {
      await db.execute('DELETE FROM bmi_assessment_question WHERE assessment_id = ?', [a.id])
      await db.execute('DELETE FROM bmi_assessment WHERE id = ?', [a.id])
    }
    res.json({ success: true, message: 'Assessment removed' })
  } catch (err) { next(err) }
})

// ── Invite Candidate for Assessment ───────────────────────────

assessmentsRouter.post('/invite/:applicationId', requireAuth, requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const tid = req.user!.tenant_id

    const [[app]] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, c.full_name, c.email, j.title AS job_title
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [req.params.applicationId, tid]
    )
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    const [[asmt]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_assessment WHERE job_id = ? AND is_active = 1', [app.job_id]
    )
    if (!asmt) return res.status(400).json({ success: false, message: 'No active assessment configured for this job' })

    // Check if already invited
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id, status FROM bmi_candidate_assessment WHERE application_id = ?', [app.id]
    )
    if (existing && existing.status !== 'expired') {
      return res.status(409).json({ success: false, message: `Assessment already ${existing.status}` })
    }

    const token = crypto.randomBytes(32).toString('hex')

    if (existing?.id) {
      await db.execute(
        `UPDATE bmi_candidate_assessment SET invite_token=?, status='invited', invite_sent_at=NOW() WHERE id=?`,
        [token, existing.id]
      )
    } else {
      await db.execute(
        `INSERT INTO bmi_candidate_assessment
          (id, tenant_id, assessment_id, application_id, candidate_id, status, invite_token, invite_sent_at)
         VALUES (UUID(), ?, ?, ?, ?, 'invited', ?, NOW())`,
        [tid, asmt.id, app.id, app.candidate_id, token]
      )
    }

    // Update application stage
    await db.execute(
      `UPDATE bmi_application SET current_stage_name = 'Assessment Pending', updated_at = NOW()
       WHERE id = ?`, [app.id]
    )

    // Send invite email
    const portalUrl = env.FRONTEND_URL
    sendAssessmentInviteEmail(app.email, app.full_name, app.job_title, `${portalUrl}/portal/assessment/${token}`).catch(() => {})

    res.json({ success: true, message: `Assessment invitation sent to ${app.email}` })
  } catch (err) { next(err) }
})

// ── Get Assessment for Candidate (by token) ───────────────────
// Public endpoint — candidate uses invite token

assessmentsRouter.get('/attempt/:token', async (req, res, next) => {
  try {
    const [[attempt]] = await db.execute<RowDataPacket[]>(
      `SELECT ca.*, a.title, a.instructions, a.time_limit_mins, a.shuffle_qs, a.total_marks
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment a ON a.id = ca.assessment_id
       WHERE ca.invite_token = ? AND ca.status IN ('invited','started')`,
      [req.params.token]
    )
    if (!attempt) return res.status(404).json({ success: false, message: 'Invalid or expired assessment link' })

    // Get questions (strip correct answers)
    const [questions] = await db.execute<RowDataPacket[]>(
      `SELECT b.id, b.title, b.question_type, b.options, b.marks, b.difficulty, aq.order_no
       FROM bmi_assessment_question aq
       JOIN bmi_aq_bank b ON b.id = aq.aq_bank_id
       WHERE aq.assessment_id = ?
       ORDER BY ${attempt.shuffle_qs ? 'RAND()' : 'aq.order_no'}`,
      [attempt.assessment_id]
    )

    res.json({ success: true, data: { attempt, questions } })
  } catch (err) { next(err) }
})

// ── Start Assessment ──────────────────────────────────────────
assessmentsRouter.post('/attempt/:token/start', async (req, res, next) => {
  try {
    const [[attempt]] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.status FROM bmi_candidate_assessment ca WHERE ca.invite_token = ?`,
      [req.params.token]
    )
    if (!attempt) return res.status(404).json({ success: false, message: 'Invalid link' })
    if (attempt.status === 'completed') return res.status(400).json({ success: false, message: 'Assessment already completed' })

    await db.execute(
      `UPDATE bmi_candidate_assessment SET status='started', started_at=NOW() WHERE id=? AND status='invited'`,
      [attempt.id]
    )
    res.json({ success: true, message: 'Assessment started' })
  } catch (err) { next(err) }
})

// ── Submit Assessment Answers ─────────────────────────────────
assessmentsRouter.post('/attempt/:token/submit', async (req, res, next) => {
  try {
    const { answers } = req.body as {
      answers: { question_id: string; selected_options?: string[]; text_answer?: string }[]
    }

    const [[attempt]] = await db.execute<RowDataPacket[]>(
      `SELECT ca.*, a.total_marks, a.passing_score, a.show_result
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment a ON a.id = ca.assessment_id
       WHERE ca.invite_token = ? AND ca.status = 'started'`,
      [req.params.token]
    )
    if (!attempt) return res.status(404).json({ success: false, message: 'Invalid or already completed' })

    let scored = 0
    let totalPossible = 0

    for (const ans of (answers ?? [])) {
      const [[q]] = await db.execute<RowDataPacket[]>(
        'SELECT id, question_type, correct_options, marks, negative_marks FROM bmi_aq_bank WHERE id = ?',
        [ans.question_id]
      )
      if (!q) continue

      const marks = Number(q.marks ?? 1)
      const negMarks = Number(q.negative_marks ?? 0)
      totalPossible += marks
      let isCorrect = false
      let awarded = 0

      if (q.question_type === 'short_text' || q.question_type === 'paragraph' || q.question_type === 'scenario') {
        isCorrect = false
        awarded = 0
      } else {
        const correctOpts: string[] = q.correct_options ? JSON.parse(q.correct_options as any) : []
        const chosen = ans.selected_options ?? []
        if (q.question_type === 'single_choice' || q.question_type === 'true_false') {
          isCorrect = chosen.length === 1 && correctOpts.includes(chosen[0])
          awarded = isCorrect ? marks : (chosen.length > 0 ? -negMarks : 0)
        } else if (q.question_type === 'multi_choice') {
          const correct = correctOpts.every(c => chosen.includes(c)) && chosen.every(c => correctOpts.includes(c))
          isCorrect = correct
          awarded = correct ? marks : (chosen.length > 0 ? -negMarks : 0)
        }
      }

      scored += Math.max(0, awarded)

      await db.execute(
        `INSERT INTO bmi_candidate_assessment_answer
          (id, attempt_id, aq_bank_id, selected_options, text_answer, is_correct, marks_awarded)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [attempt.id, q.id,
         ans.selected_options ? JSON.stringify(ans.selected_options) : null,
         ans.text_answer ?? null,
         isCorrect ? 1 : 0, Math.max(0, awarded)]
      )
    }

    const totalMarks = Number(attempt.total_marks) || totalPossible
    const percentage = totalMarks > 0 ? Math.round((scored / totalMarks) * 100 * 100) / 100 : 0
    const passed = percentage >= Number(attempt.passing_score)
    const timeTaken = attempt.started_at
      ? Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
      : null

    await db.execute(
      `UPDATE bmi_candidate_assessment
       SET status='completed', completed_at=NOW(), time_taken_secs=?,
           total_marks=?, scored_marks=?, percentage=?, passed=?
       WHERE id=?`,
      [timeTaken, totalMarks, scored, percentage, passed ? 1 : 0, attempt.id]
    )

    // Update evaluation score with assessment result
    await updateAssessmentEval(attempt.application_id, attempt.candidate_id, attempt.id)

    res.json({ success: true, message: 'Assessment submitted', data: attempt.show_result ? { scored, totalMarks, percentage, passed } : null })
  } catch (err) { next(err) }
})

async function updateAssessmentEval(applicationId: string, candidateId: string, attemptId: string) {
  try {
    const [[att]] = await db.execute<RowDataPacket[]>(
      'SELECT percentage FROM bmi_candidate_assessment WHERE id = ?', [attemptId]
    )
    if (!att) return

    // Check if evaluation_score row exists
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id, profile_score, education_score, experience_score, skill_score, resume_score FROM bmi_evaluation_score WHERE application_id = ?',
      [applicationId]
    )

    const asmtScore = Number(att.percentage ?? 0)

    if (existing?.id) {
      const total = computeTotal(
        Number(existing.profile_score), Number(existing.education_score),
        Number(existing.experience_score), Number(existing.skill_score),
        Number(existing.resume_score), asmtScore
      )
      await db.execute(
        `UPDATE bmi_evaluation_score SET assessment_score=?, total_score=?, recommendation=?, updated_at=NOW()
         WHERE id=?`,
        [asmtScore, total, getRecommendation(total), existing.id]
      )
    }
    // If no row yet, the evaluation engine will pick it up on next run
  } catch { /* non-fatal */ }
}

function computeTotal(p: number, ed: number, ex: number, sk: number, re: number, as: number): number {
  return Math.round(
    (p * 0.25 + ed * 0.15 + ex * 0.20 + sk * 0.20 + re * 0.10 + as * 0.10) * 100
  ) / 100
}

function getRecommendation(score: number): string {
  if (score >= 85) return 'highly_recommended'
  if (score >= 70) return 'recommended'
  if (score >= 50) return 'review_required'
  return 'not_recommended'
}

// ── HR: View All Assessment Attempts for a Job ────────────────
assessmentsRouter.get('/results/job/:jobId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.status, ca.percentage, ca.passed, ca.completed_at, ca.time_taken_secs,
              c.full_name, c.email, c.profile_photo_url,
              a.current_stage_name
       FROM bmi_candidate_assessment ca
       JOIN bmi_application a ON a.id = ca.application_id
       JOIN bmi_candidate c ON c.id = ca.candidate_id
       WHERE a.job_id = ? AND a.tenant_id = ?
       ORDER BY ca.completed_at DESC`,
      [req.params.jobId, req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})
