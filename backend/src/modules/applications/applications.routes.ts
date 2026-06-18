import { Router } from 'express'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { evaluateApplication } from '../../services/evaluation.service.js'
import {
  sendShortlistEmail, sendRejectionEmail, sendInterviewScheduleEmail,
} from '../../services/email.service.js'

export const applicationsRouter = Router()
applicationsRouter.use(requireAuth)

// ── GET /api/v1/applications — HR Review Dashboard ────────────

applicationsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { job_id, stage, recommendation, page = '1', limit = '20' } = req.query as any
    let where = 'a.tenant_id = ?'
    const params: any[] = [req.user!.tenant_id]

    if (job_id)         { where += ' AND a.job_id = ?';              params.push(job_id) }
    if (stage)          { where += ' AND a.current_stage_name = ?';  params.push(stage) }
    if (recommendation) { where += ' AND ev.recommendation = ?';     params.push(recommendation) }

    const pg  = Math.max(1, parseInt(page) || 1)
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const off = (pg - 1) * lim

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
         a.id, a.status, a.current_stage_name, a.applied_at, a.updated_at, a.notes,
         c.full_name, c.email, c.mobile, c.current_designation, c.experience_years,
         c.current_location, c.profile_photo_url, c.resume_url, c.skills_summary,
         j.title AS job_title, j.job_code,
         ev.total_score, ev.recommendation, ev.profile_score, ev.education_score,
         ev.experience_score, ev.skill_score, ev.resume_score, ev.assessment_score,
         ca.status AS assessment_status, ca.percentage AS assessment_pct, ca.passed AS assessment_passed
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       LEFT JOIN bmi_evaluation_score ev ON ev.application_id = a.id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
       WHERE ${where}
       ORDER BY a.applied_at DESC
       LIMIT ${lim} OFFSET ${off}`,
      params
    )

    const [[ct]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM bmi_application a
       LEFT JOIN bmi_evaluation_score ev ON ev.application_id = a.id
       WHERE ${where}`, params
    )

    res.json({ success: true, data: rows, total: (ct as any).total, page: pg, limit: lim })
  } catch (err) { next(err) }
})

// ── GET /api/v1/applications/:id — Single application detail ──

applicationsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [[row]] = await db.execute<RowDataPacket[]>(
      `SELECT
         a.*, c.full_name, c.email, c.mobile, c.current_designation, c.experience_years,
         c.current_location, c.profile_photo_url, c.resume_url, c.skills_summary,
         c.professional_summary, c.highest_education,
         j.title AS job_title, j.job_code, j.skills_required AS job_skills,
         ev.total_score, ev.recommendation, ev.profile_score, ev.education_score,
         ev.experience_score, ev.skill_score, ev.resume_score, ev.assessment_score,
         ca.status AS assessment_status, ca.percentage AS assessment_pct,
         ca.passed AS assessment_passed, ca.completed_at AS assessment_completed_at
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       LEFT JOIN bmi_evaluation_score ev ON ev.application_id = a.id
       LEFT JOIN bmi_candidate_assessment ca ON ca.application_id = a.id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    )
    if (!row) return res.status(404).json({ success: false, message: 'Application not found' })

    const [education] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_education WHERE candidate_id = ? ORDER BY passing_year DESC', [row.candidate_id]
    )
    const [experience] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_candidate_experience WHERE candidate_id = ? ORDER BY is_current DESC, joining_date DESC', [row.candidate_id]
    )
    const [skills] = await db.execute<RowDataPacket[]>(
      'SELECT skill_name, skill_level FROM bmi_candidate_skill WHERE candidate_id = ? ORDER BY sort_order', [row.candidate_id]
    )

    res.json({ success: true, data: { ...row, education, experience, skills } })
  } catch (err) { next(err) }
})

// ── PATCH /api/v1/applications/:id/stage — Move pipeline stage ──

const stageSchema = z.object({
  stage: z.enum([
    'Application Received','Assessment Pending','Shortlisted',
    'Interview Scheduled','Selected','Offer Sent','Joined','Rejected','On Hold',
  ]),
  notes: z.string().optional(),
})

applicationsRouter.patch('/:id/stage', requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const { stage, notes } = stageSchema.parse(req.body)
    const tid = req.user!.tenant_id

    const [[app]] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, c.full_name, c.email, j.title AS job_title, t.company_name
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       JOIN bmi_tenant t ON t.id = a.tenant_id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [req.params.id, tid]
    )
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    await db.execute(
      `UPDATE bmi_application SET current_stage_name=?, status=?,
       notes=COALESCE(?, notes), updated_at=NOW() WHERE id=?`,
      [stage, stage === 'Rejected' ? 'rejected' : 'active', notes ?? null, app.id]
    )

    // Trigger emails for key stages
    if (stage === 'Shortlisted') {
      sendShortlistEmail(app.email, app.full_name, app.job_title, app.company_name).catch(() => {})
    } else if (stage === 'Rejected') {
      sendRejectionEmail(app.email, app.full_name, app.job_title, app.company_name).catch(() => {})
    }

    res.json({ success: true, message: `Moved to "${stage}"` })
  } catch (err) { next(err) }
})

// ── POST /api/v1/applications/:id/re-evaluate — Rerun eval ────

applicationsRouter.post('/:id/re-evaluate', requireRole('admin','super_admin','hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const [[a]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_application WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    if (!a) return res.status(404).json({ success: false, message: 'Application not found' })

    await evaluateApplication(req.params.id)

    const [[ev]] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM bmi_evaluation_score WHERE application_id = ?', [req.params.id]
    )
    res.json({ success: true, message: 'Re-evaluated', data: ev })
  } catch (err) { next(err) }
})

// ── POST /api/v1/applications/:id/interview — Schedule interview ─

const interviewSchema = z.object({
  round_name:       z.string().min(1),
  interview_type:   z.enum(['hr','technical','managerial','final']).default('hr'),
  mode:             z.enum(['online','offline','phone']).default('online'),
  scheduled_at:     z.string(),
  duration_mins:    z.coerce.number().default(60),
  location:         z.string().optional(),
  meeting_link:     z.string().optional(),
  interviewer_ids:  z.array(z.string()).optional(),
})

applicationsRouter.post('/:id/interview', requireRole('admin','super_admin','hr_manager','recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const body = interviewSchema.parse(req.body)
    const tid = req.user!.tenant_id

    const [[app]] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, c.full_name, c.email, j.title AS job_title
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [req.params.id, tid]
    )
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    await db.execute(
      `INSERT INTO bmi_interview
        (id, tenant_id, application_id, candidate_id, job_id, round_name, interview_type,
         mode, scheduled_at, duration_mins, location, meeting_link, interviewer_ids, created_by)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tid, app.id, app.candidate_id, app.job_id, body.round_name, body.interview_type,
       body.mode, body.scheduled_at, body.duration_mins, body.location ?? null,
       body.meeting_link ?? null,
       body.interviewer_ids ? JSON.stringify(body.interviewer_ids) : null, req.user!.id]
    )

    // Move stage
    await db.execute(
      `UPDATE bmi_application SET current_stage_name='Interview Scheduled', updated_at=NOW() WHERE id=?`,
      [app.id]
    )

    // Send email
    const d = new Date(body.scheduled_at)
    sendInterviewScheduleEmail(
      app.email, app.full_name, app.job_title,
      d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      body.mode,
      body.meeting_link
    ).catch(() => {})

    res.status(201).json({ success: true, message: 'Interview scheduled' })
  } catch (err) { next(err) }
})

// ── GET /api/v1/applications/:id/interviews — List interviews ──

applicationsRouter.get('/:id/interviews', async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT i.*, GROUP_CONCAT(u.full_name) AS interviewer_names
       FROM bmi_interview i
       LEFT JOIN JSON_TABLE(i.interviewer_ids, '$[*]' COLUMNS (uid VARCHAR(36) PATH '$')) jt ON 1=1
       LEFT JOIN bmi_user u ON u.id = jt.uid
       WHERE i.application_id = ? AND i.tenant_id = ?
       GROUP BY i.id
       ORDER BY i.scheduled_at DESC`,
      [req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ── PATCH /api/v1/applications/:id/interviews/:iId/feedback ──

applicationsRouter.patch('/:id/interviews/:iId/feedback', requireRole('admin','super_admin','hr_manager','recruiter','interviewer'), async (req: AuthRequest, res, next) => {
  try {
    const { feedback, rating, recommendation, status } = z.object({
      feedback:       z.string().optional(),
      rating:         z.coerce.number().min(1).max(5).optional(),
      recommendation: z.enum(['strong_yes','yes','maybe','no','strong_no']).optional(),
      status:         z.enum(['completed','cancelled','no_show']).optional(),
    }).parse(req.body)

    await db.execute(
      `UPDATE bmi_interview SET
         feedback    = COALESCE(?, feedback),
         rating      = COALESCE(?, rating),
         recommendation = COALESCE(?, recommendation),
         status      = COALESCE(?, status),
         updated_at  = NOW()
       WHERE id = ? AND application_id = ? AND tenant_id = ?`,
      [feedback ?? null, rating ?? null, recommendation ?? null, status ?? null,
       req.params.iId, req.params.id, req.user!.tenant_id]
    )
    res.json({ success: true, message: 'Feedback saved' })
  } catch (err) { next(err) }
})
