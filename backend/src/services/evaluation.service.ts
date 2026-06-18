import type { RowDataPacket } from 'mysql2'
import { db } from '../db/mysql.js'

// Weight constants
const W = { profile: 0.25, education: 0.15, experience: 0.20, skills: 0.20, resume: 0.10, assessment: 0.10 }

export function getRecommendation(score: number): string {
  if (score >= 85) return 'highly_recommended'
  if (score >= 70) return 'recommended'
  if (score >= 50) return 'review_required'
  return 'not_recommended'
}

export function getRecommendationLabel(r: string): string {
  return {
    highly_recommended: 'Highly Recommended',
    recommended:        'Recommended',
    review_required:    'Review Required',
    not_recommended:    'Not Recommended',
  }[r] ?? r
}

// ── Profile Completion Score (max 100, weight 25%) ─────────────
async function profileScore(candidateId: string): Promise<number> {
  const [[c]] = await db.execute<RowDataPacket[]>(
    `SELECT c.profile_photo_url, c.resume_url, c.full_name, c.gender, c.date_of_birth,
            c.mobile, c.email, c.work_preference, c.current_location,
            c.professional_summary, c.career_objective, c.skills_summary,
            (SELECT COUNT(*) FROM bmi_candidate_education  WHERE candidate_id=c.id) AS edu,
            (SELECT COUNT(*) FROM bmi_candidate_experience WHERE candidate_id=c.id) AS exp,
            (SELECT COUNT(*) FROM bmi_candidate_skill      WHERE candidate_id=c.id) AS skl
     FROM bmi_candidate c WHERE c.id = ?`, [candidateId]
  )
  if (!c) return 0
  let s = 0
  if (c.profile_photo_url) s += 25
  if (c.full_name && c.gender && c.date_of_birth) s += 20
  if (c.mobile && c.email) s += 10
  if (Number(c.edu) > 0) s += 15
  if (Number(c.exp) > 0) s += 15
  if (Number(c.skl) > 0) s += 10
  if (c.work_preference && c.current_location) s += 5
  return Math.min(100, s)
}

// ── Education Match Score (max 100, weight 15%) ────────────────
async function educationScore(candidateId: string): Promise<number> {
  const [[c]] = await db.execute<RowDataPacket[]>(
    `SELECT highest_education,
            (SELECT COUNT(*) FROM bmi_candidate_education WHERE candidate_id = ?) AS edu_count
     FROM bmi_candidate WHERE id = ?`, [candidateId, candidateId]
  )
  if (!c) return 0
  if (Number(c.edu_count) === 0) return 0
  const edu = (c.highest_education ?? '').toLowerCase()
  if (edu.includes('phd') || edu.includes('doctorate')) return 100
  if (edu.includes('master') || edu.includes('mba') || edu.includes('m.tech')) return 90
  if (edu.includes('bachelor') || edu.includes('b.tech') || edu.includes('b.e') || edu.includes('bca')) return 80
  if (edu.includes('diploma') || edu.includes('12th') || edu.includes('hsc')) return 60
  return 40
}

// ── Experience Match Score (max 100, weight 20%) ──────────────
async function experienceScore(candidateId: string, jobId: string): Promise<number> {
  const [[c]] = await db.execute<RowDataPacket[]>(
    'SELECT experience_years FROM bmi_candidate WHERE id = ?', [candidateId]
  )
  const [[j]] = await db.execute<RowDataPacket[]>(
    'SELECT experience_min_years, experience_max_years FROM bmi_job WHERE id = ?', [jobId]
  )
  if (!c || !j) return 0
  const candYrs = Number(c.experience_years ?? 0)
  const minYrs  = Number(j.experience_min_years ?? 0)
  const maxYrs  = Number(j.experience_max_years ?? 99)

  if (candYrs >= minYrs && candYrs <= maxYrs) return 100
  if (candYrs >= minYrs) return 85      // over-experienced
  const gap = minYrs - candYrs
  if (gap <= 1) return 70
  if (gap <= 2) return 50
  if (gap <= 3) return 30
  return 10
}

// ── Skill Match Score (max 100, weight 20%) ────────────────────
async function skillScore(candidateId: string, jobId: string): Promise<number> {
  const [[j]] = await db.execute<RowDataPacket[]>(
    'SELECT skills_required FROM bmi_job WHERE id = ?', [jobId]
  )
  if (!j?.skills_required) return 50 // no skills required → neutral

  let requiredSkills: string[] = []
  try { requiredSkills = JSON.parse(j.skills_required as any) } catch { return 50 }
  if (requiredSkills.length === 0) return 50

  const [candSkills] = await db.execute<RowDataPacket[]>(
    'SELECT skill_name FROM bmi_candidate_skill WHERE candidate_id = ?', [candidateId]
  )
  const candSet = new Set(candSkills.map((s: any) => s.skill_name.toLowerCase()))

  // Also check skills_summary
  const [[c]] = await db.execute<RowDataPacket[]>(
    'SELECT skills_summary FROM bmi_candidate WHERE id = ?', [candidateId]
  )
  const summary = (c?.skills_summary ?? '').toLowerCase()

  let matched = 0
  for (const skill of requiredSkills) {
    const sl = skill.toLowerCase()
    if (candSet.has(sl) || summary.includes(sl)) matched++
  }

  return Math.round((matched / requiredSkills.length) * 100)
}

// ── Resume Score (max 100, weight 10%) ─────────────────────────
async function resumeScore(candidateId: string): Promise<number> {
  const [[c]] = await db.execute<RowDataPacket[]>(
    'SELECT resume_url, resume_text FROM bmi_candidate WHERE id = ?', [candidateId]
  )
  if (!c?.resume_url) return 0
  const text = c.resume_text ?? ''
  if (text.length > 500) return 90
  if (text.length > 100) return 70
  return 50 // has resume but no parsed text
}

// ── Main: Evaluate Application ────────────────────────────────

export async function evaluateApplication(applicationId: string): Promise<void> {
  try {
    const [[app]] = await db.execute<RowDataPacket[]>(
      'SELECT id, candidate_id, job_id, tenant_id FROM bmi_application WHERE id = ?',
      [applicationId]
    )
    if (!app) return

    const [ps, es, exs, sks, rs] = await Promise.all([
      profileScore(app.candidate_id),
      educationScore(app.candidate_id),
      experienceScore(app.candidate_id, app.job_id),
      skillScore(app.candidate_id, app.job_id),
      resumeScore(app.candidate_id),
    ])

    // Assessment score: use existing if already graded
    const [[existingEval]] = await db.execute<RowDataPacket[]>(
      'SELECT assessment_score FROM bmi_evaluation_score WHERE application_id = ?',
      [applicationId]
    )
    const as_ = Number(existingEval?.assessment_score ?? 0)

    const total = Math.round(
      (ps * W.profile + es * W.education + exs * W.experience + sks * W.skills + rs * W.resume + as_ * W.assessment)
      * 100
    ) / 100

    const rec = getRecommendation(total)

    await db.execute(
      `INSERT INTO bmi_evaluation_score
        (id, tenant_id, application_id, candidate_id, job_id,
         profile_score, education_score, experience_score, skill_score, resume_score, assessment_score,
         total_score, recommendation)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         profile_score=VALUES(profile_score), education_score=VALUES(education_score),
         experience_score=VALUES(experience_score), skill_score=VALUES(skill_score),
         resume_score=VALUES(resume_score), total_score=VALUES(total_score),
         recommendation=VALUES(recommendation), updated_at=NOW()`,
      [app.tenant_id, applicationId, app.candidate_id, app.job_id,
       ps, es, exs, sks, rs, as_, total, rec]
    )
  } catch { /* non-fatal — don't break the apply flow */ }
}
