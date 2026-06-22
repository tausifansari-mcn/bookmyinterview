import crypto from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { db } from '../db/mysql.js'

interface AutoAssessmentResult {
  assessment_id: string | null
  candidate_assessment_id: string | null
  invite_token: string | null
  total_questions: number
  message: string
}

/**
 * Auto-generate an assessment for a candidate application
 * by pulling skill-matched questions from the platform question bank.
 */
export async function autoGenerateAssessment(
  applicationId: string,
  jobId: string,
  tenantId: string,
  candidateId: string
): Promise<AutoAssessmentResult> {
  const result: AutoAssessmentResult = {
    assessment_id: null,
    candidate_assessment_id: null,
    invite_token: null,
    total_questions: 0,
    message: 'No questions available',
  }

  try {
    // 1. Get job skills
    const [jobRows] = await db.execute<RowDataPacket[]>(
      'SELECT skills_required FROM bmi_job WHERE id = ?',
      [jobId]
    )
    if (!jobRows[0]) return { ...result, message: 'Job not found' }

    let skills: string[] = []
    try {
      skills = typeof jobRows[0].skills_required === 'string'
        ? JSON.parse(jobRows[0].skills_required)
        : (jobRows[0].skills_required ?? [])
    } catch {
      skills = []
    }

    const QUESTION_SELECT = `SELECT q.id, q.question_text, q.question_type, q.options, q.correct_answer,
              q.skills, q.difficulty, q.marks, q.explanation
       FROM bmi_platform_question_bank q WHERE q.is_active = 1
       ORDER BY CASE q.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END
       LIMIT 20`

    let questions: RowDataPacket[] = []

    if (skills.length === 0) {
      // No skills defined — pull any available questions from the bank
      const [anyQ] = await db.execute<RowDataPacket[]>(QUESTION_SELECT, [])
      questions = anyQ
    } else {
      // 2. Build a query that matches ANY of the job skills
      const skillConditions = skills.map(() => 'JSON_CONTAINS(q.skills, ?)')
      const skillParams = skills.map(s => JSON.stringify(s))

      // 3. Pull skill-matched questions (up to 20)
      const [matchedQ] = await db.execute<RowDataPacket[]>(
        `SELECT q.id, q.question_text, q.question_type, q.options, q.correct_answer,
                q.skills, q.difficulty, q.marks, q.explanation
         FROM bmi_platform_question_bank q
         WHERE q.is_active = 1 AND (${skillConditions.join(' OR ')})
         ORDER BY CASE q.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END
         LIMIT 20`,
        skillParams
      )
      questions = matchedQ

      // Fall back to all questions if no skill-matched ones
      if (questions.length === 0) {
        const [anyQ] = await db.execute<RowDataPacket[]>(QUESTION_SELECT, [])
        questions = anyQ
      }
    }

    if (questions.length === 0) return { ...result, message: 'No questions in question bank' }

    // 4. Build assessment questions array (preserve correct answer indices for scoring)
    const assessmentQuestions = questions.map((q: any, i: number) => {
      let options: string[] = []
      try {
        options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? [])
      } catch { options = [] }

      // correct_answer from question bank is an array of indices e.g. [2]
      let correctIndices: number[] = []
      try {
        const raw = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : (q.correct_answer ?? [])
        correctIndices = Array.isArray(raw) ? raw.map(Number) : [Number(raw)]
      } catch { correctIndices = [0] }

      return {
        id: q.id,
        title: q.question_text,
        question_type: q.question_type,
        options,
        marks: Number(q.marks ?? 1),
        difficulty: q.difficulty,
        order_no: i + 1,
        correct_index: correctIndices[0] ?? 0,
        correct_indices: correctIndices,
      }
    })

    const totalMarks = assessmentQuestions.reduce((s: number, q: any) => s + q.marks, 0)

    // 5. Create or reuse an auto-generated assessment for this job
    const [existingAssess] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM bmi_assessment
       WHERE job_id = ? AND title = 'Auto Assessment' AND is_active = 1
       LIMIT 1`,
      [jobId]
    )

    let assessmentId: string
    if (existingAssess[0]) {
      assessmentId = existingAssess[0].id
      // Update questions
      await db.execute(
        'UPDATE bmi_assessment SET questions = ?, total_marks = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(assessmentQuestions), totalMarks, assessmentId]
      )
    } else {
      assessmentId = crypto.randomUUID()
      await db.execute(
        `INSERT INTO bmi_assessment
          (id, tenant_id, job_id, title, description, type, duration_mins, time_limit_mins,
           total_marks, passing_marks, passing_score, questions, is_active, created_by, created_at)
         VALUES (?, ?, ?, 'Auto Assessment', 'Auto-generated skill assessment',
          'mcq', 30, 30, ?, ?, 70.00, ?, 1, ?, NOW())`,
        [assessmentId, tenantId, jobId, totalMarks, Math.ceil(totalMarks * 0.4), JSON.stringify(assessmentQuestions), '00000000-0000-0000-0000-000000000001']
      )
    }

    // 6. Create candidate assessment
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const caId = crypto.randomUUID()
    await db.execute(
      `INSERT INTO bmi_candidate_assessment
        (id, tenant_id, assessment_id, application_id, candidate_id, status, invite_token, total_marks, created_at)
       VALUES (?, ?, ?, ?, ?, 'invited', ?, ?, NOW())`,
      [caId, tenantId, assessmentId, applicationId, candidateId, inviteToken, totalMarks]
    )

    // 7. Log auto-assessment generation
    const questionIds = questions.map((q: any) => q.id)
    await db.execute(
      `INSERT INTO bmi_assessment_auto_log
        (id, application_id, job_id, question_ids, skills_matched, total_questions, total_marks, passing_score)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, 70.00)`,
      [applicationId, jobId, JSON.stringify(questionIds), JSON.stringify(skills), questions.length, totalMarks]
    )

    return {
      assessment_id: assessmentId,
      candidate_assessment_id: caId,
      invite_token: inviteToken,
      total_questions: questions.length,
      message: `Assessment generated with ${questions.length} questions across ${skills.length} skills`,
    }
  } catch (err: any) {
    console.error('[auto-assessment]', err.message)
    return { ...result, message: `Error: ${err.message}` }
  }
}
