import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { z } from 'zod'

export const aiRouter = Router()
aiRouter.use(requireAuth)

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return '[AI_NOT_CONFIGURED] Set ANTHROPIC_API_KEY in .env'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`)
  const data = await res.json() as any
  return data.content[0].text as string
}

// POST /api/v1/ai/screen/:applicationId
aiRouter.post('/screen/:applicationId', requireRole('admin', 'hr_manager', 'recruiter'), async (req: AuthRequest, res, next) => {
  try {
    const [appRows] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, c.full_name, c.experience_years, c.current_salary, c.expected_salary,
              c.resume_text, c.skills_summary, j.title AS job_title, j.description AS job_desc,
              j.requirements, j.experience_min_years, j.experience_max_years,
              j.salary_min, j.salary_max
       FROM bmi_application a
       JOIN bmi_candidate c ON c.id = a.candidate_id
       JOIN bmi_job j ON j.id = a.job_id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [req.params.applicationId, req.user!.tenant_id]
    )
    const app = appRows[0]
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' })

    const [credits] = await db.execute<RowDataPacket[]>(
      `SELECT ai_credits FROM bmi_tenant WHERE id = ?`, [req.user!.tenant_id]
    )
    if ((credits[0]?.ai_credits ?? 0) < 1) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits' })
    }

    const prompt = `You are an expert recruitment AI. Analyze this job application and provide a structured assessment.

JOB: ${app.job_title}
Requirements: ${app.requirements ?? 'Not specified'}
Experience needed: ${app.experience_min_years}-${app.experience_max_years ?? '+'} years
Salary range: ${app.salary_min ?? 'N/A'} - ${app.salary_max ?? 'N/A'} INR/year

CANDIDATE: ${app.full_name}
Experience: ${app.experience_years ?? 'Not specified'} years
Current salary: ${app.current_salary ?? 'N/A'}
Expected salary: ${app.expected_salary ?? 'N/A'}
Resume: ${app.resume_text ? app.resume_text.slice(0, 2000) : 'Not provided'}

Respond in JSON format:
{
  "match_score": <0-100>,
  "recommendation": "<shortlist|maybe|reject>",
  "experience_match": <true|false>,
  "salary_match": <true|false>,
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "summary": "<2-3 sentence summary>"
}`

    const aiResponse = await callClaude(prompt)
    let parsed: any = {}
    try { parsed = JSON.parse(aiResponse) } catch { parsed = { summary: aiResponse, match_score: 50, recommendation: 'maybe' } }

    await db.execute(
      `INSERT INTO bmi_ai_screening_result
         (id, tenant_id, application_id, job_id, model_used, match_score, recommendation, summary,
          experience_match, salary_match, skill_match)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE match_score=VALUES(match_score), recommendation=VALUES(recommendation), summary=VALUES(summary)`,
      [req.user!.tenant_id, app.id, app.job_id, 'claude-sonnet-4-6',
       parsed.match_score ?? 50, parsed.recommendation ?? 'maybe', parsed.summary ?? '',
       parsed.experience_match ? 1 : 0, parsed.salary_match ? 1 : 0,
       JSON.stringify({ strengths: parsed.strengths, concerns: parsed.concerns })]
    )

    await db.execute(
      `UPDATE bmi_application SET ai_match_score = ?, ai_match_reason = ? WHERE id = ?`,
      [parsed.match_score, parsed.summary, app.id]
    )

    await db.execute(
      `UPDATE bmi_tenant SET ai_credits = ai_credits - 1 WHERE id = ?`, [req.user!.tenant_id]
    )
    await db.execute(
      `INSERT INTO bmi_ai_credit_ledger (id, tenant_id, action, credits_delta, balance_after, reference_id)
       SELECT UUID(), ?, 'resume_screen', -1, ai_credits, ? FROM bmi_tenant WHERE id = ?`,
      [req.user!.tenant_id, app.id, req.user!.tenant_id]
    )

    res.json({ success: true, data: parsed })
  } catch (err) { next(err) }
})

// POST /api/v1/ai/generate-jd
aiRouter.post('/generate-jd', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const { title, department, requirements, experience_years, company_about } = req.body
    const prompt = `Write a professional, compelling job description for the following role.

Title: ${title}
Department: ${department ?? 'Operations'}
Experience Required: ${experience_years ?? '1-3'} years
Key Requirements: ${requirements ?? 'Customer service, communication skills'}
Company: ${company_about ?? 'A leading BPO company in India'}

Write in a professional tone. Include: About the Role, Responsibilities (5-7 points), Requirements (5-7 points), What We Offer. Keep it under 400 words.`

    const jd = await callClaude(prompt)
    res.json({ success: true, data: { jd } })
  } catch (err) { next(err) }
})

// POST /api/v1/ai/interview-questions
aiRouter.post('/interview-questions', requireRole('admin', 'hr_manager', 'recruiter', 'interviewer'), async (req: AuthRequest, res, next) => {
  try {
    const { job_title, stage, candidate_experience } = req.body
    const prompt = `Generate 8 interview questions for a ${stage ?? 'HR'} round interview.
Role: ${job_title}
Candidate Experience: ${candidate_experience ?? '1-2'} years

Include a mix of: behavioral, situational, and role-specific questions.
Format as JSON array: [{"question": "...", "type": "behavioral|situational|technical", "expected_focus": "..."}]`

    const response = await callClaude(prompt)
    let questions = []
    try { questions = JSON.parse(response) } catch { questions = [{ question: response }] }
    res.json({ success: true, data: { questions } })
  } catch (err) { next(err) }
})
