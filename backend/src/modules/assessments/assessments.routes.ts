import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'

export const assessmentsRouter = Router()

// GET /api/v1/assessments/attempt/:token
assessmentsRouter.get('/attempt/:token', async (req, res, next) => {
  try {
    const { token } = req.params
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.status, ca.started_at, ca.total_marks, ca.assessment_id,
              ass.title, ass.instructions, ass.time_limit_mins, ass.questions, ass.passing_score
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment ass ON ass.id = ca.assessment_id
       WHERE ca.invite_token = ?`,
      [token]
    )

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Invalid or expired assessment link.' })
    if (rows[0].status === 'expired') return res.status(410).json({ success: false, message: 'This assessment link has expired.' })

    let questions: any[] = []
    try {
      questions = typeof rows[0].questions === 'string'
        ? JSON.parse(rows[0].questions)
        : (rows[0].questions ?? [])
    } catch { questions = [] }

    const sanitized = questions.map((q: any) => ({
      id:            q.id,
      title:         q.title,
      question_type: q.question_type ?? 'single_choice',
      options:       q.options ?? null,
      marks:         Number(q.marks ?? 1),
      difficulty:    q.difficulty ?? 'medium',
      order_no:      Number(q.order_no ?? 0),
    }))

    const totalMarks = sanitized.reduce((s: number, q: any) => s + q.marks, 0)

    res.json({
      success: true,
      data: {
        attempt: {
          id:             rows[0].id,
          status:         rows[0].status,
          title:          rows[0].title,
          instructions:   rows[0].instructions ?? null,
          time_limit_mins:Number(rows[0].time_limit_mins),
          total_marks:    totalMarks,
          passing_score:  Number(rows[0].passing_score ?? 50),
        },
        questions: sanitized,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/v1/assessments/attempt/:token/start
assessmentsRouter.post('/attempt/:token/start', async (req, res, next) => {
  try {
    const { token } = req.params
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, status FROM bmi_candidate_assessment WHERE invite_token = ?`, [token]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Invalid assessment link.' })
    if (rows[0].status === 'completed') return res.status(409).json({ success: false, message: 'Already submitted.' })
    if (rows[0].status === 'expired')   return res.status(410).json({ success: false, message: 'Expired.' })

    await db.execute(
      `UPDATE bmi_candidate_assessment SET status='started', started_at=NOW() WHERE id=? AND status!='completed'`,
      [rows[0].id]
    )
    res.json({ success: true, message: 'Assessment started.' })
  } catch (err) { next(err) }
})

// POST /api/v1/assessments/attempt/:token/submit
assessmentsRouter.post('/attempt/:token/submit', async (req, res, next) => {
  try {
    const { token } = req.params
    const { answers = [] } = req.body as {
      answers: { question_id: string; selected_options?: string[]; text_answer?: string }[]
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT ca.id, ca.status, ca.started_at, ca.application_id,
              ass.questions, ass.passing_score
       FROM bmi_candidate_assessment ca
       JOIN bmi_assessment ass ON ass.id = ca.assessment_id
       WHERE ca.invite_token = ?`,
      [token]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Invalid assessment link.' })
    if (rows[0].status === 'completed') return res.status(409).json({ success: false, message: 'Already submitted.' })

    let questions: any[] = []
    try {
      questions = typeof rows[0].questions === 'string'
        ? JSON.parse(rows[0].questions)
        : (rows[0].questions ?? [])
    } catch { questions = [] }

    const answerMap = new Map<string, { selected_options?: string[]; text_answer?: string }>()
    for (const a of answers) answerMap.set(a.question_id, a)

    let scoredMarks = 0
    const totalMarks = questions.reduce((s: number, q: any) => s + Number(q.marks ?? 1), 0)
    const answersDetail: any[] = []

    for (const q of questions) {
      const ans = answerMap.get(q.id)
      const marks = Number(q.marks ?? 1)
      const type  = q.question_type ?? 'single_choice'
      let isCorrect = false
      let marksScored = 0
      let correctOptions: string[] = []

      if (type === 'single_choice' || type === 'true_false') {
        const correctOpt = Array.isArray(q.options) ? q.options[Number(q.correct_index ?? 0)] : null
        if (correctOpt) correctOptions = [correctOpt]
        if (correctOpt && ans?.selected_options?.[0] === correctOpt) {
          isCorrect = true; marksScored = marks; scoredMarks += marks
        }
      } else if (type === 'multi_choice') {
        const correctIdxs: number[] = Array.isArray(q.correct_indices) ? q.correct_indices : [Number(q.correct_index ?? 0)]
        correctOptions = correctIdxs.map((i: number) => q.options?.[i]).filter(Boolean).sort()
        const selected = [...(ans?.selected_options ?? [])].sort()
        if (JSON.stringify(selected) === JSON.stringify(correctOptions)) {
          isCorrect = true; marksScored = marks; scoredMarks += marks
        }
      }
      // text_answer questions: manual review, no auto score

      answersDetail.push({
        question_id: q.id,
        question_title: q.title,
        question_type: type,
        options: q.options ?? null,
        selected_options: ans?.selected_options ?? null,
        text_answer: ans?.text_answer ?? null,
        correct_options: correctOptions.length > 0 ? correctOptions : null,
        is_correct: isCorrect,
        marks_available: marks,
        marks_scored: marksScored,
      })
    }

    const percentage   = totalMarks > 0 ? (scoredMarks / totalMarks) * 100 : 0
    const passingScore = Number(rows[0].passing_score ?? 50)
    const passed       = percentage >= passingScore
    const timeTaken    = rows[0].started_at
      ? Math.round((Date.now() - new Date(rows[0].started_at).getTime()) / 1000)
      : null

    await db.execute(
      `UPDATE bmi_candidate_assessment SET status='completed', completed_at=NOW(),
       scored_marks=?, percentage=?, passed=?, time_taken_secs=?, answers_submitted_json=? WHERE id=?`,
      [scoredMarks, percentage.toFixed(2), passed ? 1 : 0, timeTaken, JSON.stringify(answersDetail), rows[0].id]
    )

    // Reflect score on application
    if (rows[0].application_id) {
      db.execute(`UPDATE bmi_application SET ai_match_score=? WHERE id=?`,
        [percentage.toFixed(2), rows[0].application_id]).catch(() => {})

      // ── 90% Rule Check ─────────────────────────────────────
      ;(async () => {
        try {
          const appId = rows[0].application_id

          // Get profile match score from evaluation
          const [evalRows] = await db.execute<RowDataPacket[]>(
            `SELECT total_score FROM bmi_evaluation_score WHERE application_id = ? LIMIT 1`,
            [appId]
          )
          const profileMatchPct = evalRows[0] ? Number((evalRows[0] as any).total_score) : null

          // Get assessment score
          const assessmentPct = percentage

          const profilePassed = profileMatchPct !== null && profileMatchPct >= 90
          const assessmentPassed = assessmentPct >= 90
          const bothPassed = profilePassed && assessmentPassed

          // Log match result
          await db.execute(
            `INSERT INTO bmi_match_result
              (id, application_id, profile_match_pct, assessment_pct,
               profile_passed, assessment_passed, both_passed, checked_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
               profile_match_pct = VALUES(profile_match_pct),
               assessment_pct = VALUES(assessment_pct),
               profile_passed = VALUES(profile_passed),
               assessment_passed = VALUES(assessment_passed),
               both_passed = VALUES(both_passed),
               checked_at = NOW()`,
            [
              appId,
              profileMatchPct !== null ? profileMatchPct.toFixed(2) : null,
              assessmentPct.toFixed(2),
              profilePassed ? 1 : 0,
              assessmentPassed ? 1 : 0,
              bothPassed ? 1 : 0,
            ]
          )

          // If both passed, trigger interview scheduling flow
          if (bothPassed) {
            const [appRows] = await db.execute<RowDataPacket[]>(
              `SELECT a.id, a.candidate_id, a.job_id, a.tenant_id,
                      c.email AS candidate_email, c.full_name AS candidate_name,
                      j.title AS job_title, t.company_name
               FROM bmi_application a
               JOIN bmi_candidate c ON c.id = a.candidate_id
               JOIN bmi_job j ON j.id = a.job_id
               JOIN bmi_tenant t ON t.id = a.tenant_id
               WHERE a.id = ?`,
              [appId]
            )
            if (appRows[0]) {
              const app = appRows[0] as any

              // Update application stage
              await db.execute(
                `UPDATE bmi_application SET
                  current_stage_name = 'Interview Scheduled',
                  status = 'active',
                  updated_at = NOW()
                 WHERE id = ?`,
                [appId]
              )

              // Send email to candidate to schedule interview
              const { sendInterviewScheduleEmail } = await import('../../services/email.service.js')
              sendInterviewScheduleEmail(
                app.candidate_email,
                app.candidate_name,
                app.job_title,
                'TBD (Schedule via portal)',
                'Flexible',
                'Online',
                undefined
              ).catch(() => {})

              // Notify super admin about qualified candidate
              await db.execute(
                `INSERT INTO bmi_notification_log
                  (id, tenant_id, channel, recipient_type, recipient_id, subject, body,
                   event_key, reference_id, reference_type, status, created_at)
                 VALUES (UUID(), ?, 'in_app', 'platform_admin', 'all',
                  ?, ?, 'candidate_qualified', ?, 'application', 'sent', NOW())`,
                [
                  app.tenant_id,
                  `Qualified Candidate: ${app.candidate_name} for ${app.job_title}`,
                  `${app.candidate_name} has qualified (profile: ${profileMatchPct?.toFixed(0) ?? 'N/A'}%, assessment: ${assessmentPct.toFixed(0)}%) for "${app.job_title}" at ${app.company_name}. Ready for interview scheduling.`,
                  appId,
                ]
              )
            }
          }
        } catch (e: any) {
          console.error('[90pct-rule]', e.message)
        }
      })()
    }
    res.json({
      success: true,
      message: passed ? 'Congratulations! You passed.' : 'Assessment submitted.',
      data: { scored: scoredMarks, totalMarks, percentage: parseFloat(percentage.toFixed(1)), passed },
    })
  } catch (err) { next(err) }
})
