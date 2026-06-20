import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'

export const uploadRouter = Router()

// ── Admin auth middleware ─────────────────────────────────────
function requireAdmin(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Login required' })
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type === 'candidate') return res.status(401).json({ success: false, message: 'Invalid token type' })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }
}

// ── Candidate auth middleware ─────────────────────────────────
function requireCandidate(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Login required' })
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type !== 'candidate') return res.status(401).json({ success: false, message: 'Invalid token type' })
    req.candidate = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }
}

// ── Multer storage — saves to backend/uploads/ ────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${crypto.randomUUID()}${ext}`
    cb(null, name)
  },
})

// Separate storage for media: prefixes filename with 'video-' or 'audio-'
// so the saved URL encodes the type for correct player selection later.
const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase() || '.webm'
    const base   = file.mimetype.split(';')[0].trim()
    const prefix = base.startsWith('video/') ? 'video' : 'audio'
    cb(null, `${prefix}-${crypto.randomUUID()}${ext}`)
  },
})

const photoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPG, PNG or WEBP images are allowed'))
  },
})

const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, DOC or DOCX files are allowed'))
  },
})

const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 25 * 1024 * 1024 },  // 25 MB
  fileFilter: (_req, file, cb) => {
    // Strip codec params (e.g. 'audio/webm;codecs=opus' → 'audio/webm') before matching
    const base = file.mimetype.split(';')[0].trim()
    const allowed = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a',
      'audio/webm', 'audio/ogg', 'video/mp4', 'video/webm', 'video/quicktime',
    ]
    if (allowed.includes(base)) cb(null, true)
    else cb(new Error('Only MP3, WAV, M4A, MP4 or WEBM files are allowed'))
  },
})

function fileUrl(filename: string): string {
  return `/uploads/${filename}`
}

// ── Claude helper ────────────────────────────────────────────
async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`)
  const data = await res.json() as any
  return data.content[0].text as string
}

// ── Regex-based resume parser (fallback when AI key is absent) ─
function parseResumeWithRegex(text: string): Record<string, unknown> {
  const emailMatch    = text.match(/[\w.+%-]+@[\w.-]+\.[a-zA-Z]{2,6}/)
  const mobileMatch   = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/)
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w%-]+)/i)
  const githubMatch   = text.match(/github\.com\/([\w-]+)/i)
  return {
    full_name: null, email: emailMatch?.[0] ?? null,
    mobile: mobileMatch?.[0]?.replace(/\D/g, '').slice(-10) ?? null,
    linkedin_url: linkedinMatch ? `https://www.linkedin.com/in/${linkedinMatch[1]}` : null,
    github_url:   githubMatch   ? `https://github.com/${githubMatch[1]}`            : null,
    skills: [], education: [], experience: [], certifications: [],
  }
}

// ── PDF text extractor ───────────────────────────────────────
async function extractPdfText(filePath: string): Promise<string> {
  let parser: any
  try {
    const { PDFParse } = await import('pdf-parse')
    const buffer   = fs.readFileSync(filePath)
    parser = new PDFParse({ data: buffer })
    const result   = await parser.getText()
    return result.text?.slice(0, 6000) ?? ''
  } catch {
    return ''
  } finally {
    await parser?.destroy?.()
  }
}

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/admin-photo  — admin/user avatar
// ════════════════════════════════════════════════════════════
uploadRouter.post('/admin-photo', requireAdmin, photoUpload.single('photo'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const url = fileUrl(req.file.filename)
    await db.execute('UPDATE bmi_user SET avatar_url = ? WHERE id = ?', [url, req.admin.sub])
    res.json({ success: true, message: 'Photo updated successfully', data: { url } })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/photo
// ════════════════════════════════════════════════════════════
uploadRouter.post('/photo', requireCandidate, photoUpload.single('photo'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const url = fileUrl(req.file.filename)

    // Save URL to candidate profile
    await db.execute(
      'UPDATE bmi_candidate SET profile_photo_url = ? WHERE id = ?',
      [url, req.candidate.sub]
    )

    try {
      await db.execute(
        `INSERT INTO bmi_candidate_document
           (id, tenant_id, candidate_id, document_type, file_name, file_url, file_size_kb, mime_type, uploaded_by)
         VALUES (UUID(), ?, ?, 'photo', ?, ?, ?, ?, 'candidate')
         ON DUPLICATE KEY UPDATE file_url = VALUES(file_url), file_name = VALUES(file_name)`,
        [req.candidate.tenant_id, req.candidate.sub, req.file.originalname, url, Math.round(req.file.size / 1024), req.file.mimetype]
      )
    } catch {}

    res.json({ success: true, message: 'Photo uploaded successfully', data: { url } })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/resume
// ════════════════════════════════════════════════════════════
uploadRouter.post('/resume', requireCandidate, resumeUpload.single('resume'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const url = fileUrl(req.file.filename)

    // Save URL + extract text
    let resumeText = ''
    if (req.file.mimetype === 'application/pdf') {
      resumeText = await extractPdfText(req.file.path)
    }

    await db.execute(
      'UPDATE bmi_candidate SET resume_url = ?, resume_text = ? WHERE id = ?',
      [url, resumeText || null, req.candidate.sub]
    )

    try {
      await db.execute(
        `INSERT INTO bmi_candidate_document
           (id, tenant_id, candidate_id, document_type, file_name, file_url, file_size_kb, mime_type, uploaded_by)
         VALUES (UUID(), ?, ?, 'resume', ?, ?, ?, ?, 'candidate')`,
        [req.candidate.tenant_id, req.candidate.sub, req.file.originalname, url, Math.round(req.file.size / 1024), req.file.mimetype]
      )
    } catch {}

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: { url, has_text: !!resumeText, text_length: resumeText.length },
    })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/parse-resume  — AI auto-fill
// ════════════════════════════════════════════════════════════
uploadRouter.post('/parse-resume', requireCandidate, async (req: any, res, next) => {
  let resumeText = ''
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT resume_text, full_name, email, mobile FROM bmi_candidate WHERE id = ?',
      [req.candidate.sub]
    )
    const candidate = rows[0]
    if (!candidate?.resume_text) {
      return res.status(400).json({ success: false, message: 'No resume text found. Please upload a PDF resume first.' })
    }
    resumeText = candidate.resume_text

    const prompt = `You are a professional resume parser. Extract structured information from the resume text below.

Return ONLY a valid JSON object with these exact keys (use null for missing fields):
{
  "full_name": "string",
  "middle_name": "string or null",
  "last_name": "string or null",
  "email": "string or null",
  "mobile": "string or null",
  "linkedin_url": "string or null",
  "github_url": "string or null",
  "portfolio_url": "string or null",
  "current_company": "string or null",
  "current_designation": "string or null",
  "total_experience_years": "number or null",
  "current_location": "string or null",
  "professional_summary": "string (max 500 chars) or null",
  "career_objective": "string (max 500 chars) or null",
  "skills": [{"skill_name": "string", "skill_level": "beginner|intermediate|advanced|expert"}],
  "education": [{"qualification": "string", "degree": "string", "specialization": "string or null", "institute": "string", "university": "string or null", "passing_year": "number or null", "percentage": "number or null"}],
  "experience": [{"company_name": "string", "designation": "string", "joining_date": "YYYY-MM-DD", "relieving_date": "YYYY-MM-DD or null", "is_current": 0 or 1, "roles_responsibilities": "string or null"}],
  "certifications": [{"certification_name": "string", "issuing_organization": "string", "issue_date": "YYYY-MM-DD or null"}]
}

Resume Text:
${resumeText}

Return ONLY the JSON object. No explanation, no markdown, no code blocks.`

    const aiResponse = await callClaude(prompt)

    let parsed: any = {}
    try {
      const clean = aiResponse.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return res.status(422).json({ success: false, message: 'AI could not parse the resume. Please fill the form manually.' })
    }

    res.json({ success: true, message: 'Resume parsed successfully by AI', data: parsed })
  } catch (err: any) {
    if (err.message === 'AI not configured') {
      // AI key absent — fall back to regex extraction so the button still works
      const fallback = parseResumeWithRegex(resumeText)
      return res.json({
        success: true,
        message: 'Resume parsed (basic mode). Add ANTHROPIC_API_KEY to .env for full AI parsing.',
        data: fallback,
      })
    }
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/parse-resume-file — direct upload + AI parse (PDF or DOCX)
// ════════════════════════════════════════════════════════════
const directParseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, DOC or DOCX files are allowed'))
  },
})

async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    try {
      // pdf-parse v2 default export
      const mod = await import('pdf-parse')
      const pdfParse = (mod as any).default ?? mod
      const data = await pdfParse(buffer)
      return ((data as any).text ?? '').slice(0, 8000)
    } catch { return '' }
  }
  // DOCX
  try {
    const mammoth = await import('mammoth')
    const result = await (mammoth as any).extractRawText({ buffer })
    return ((result as any).value ?? '').slice(0, 8000)
  } catch { return '' }
}

async function parseWithAffinda(text: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.AFFINDA_API_KEY
  if (!apiKey) throw new Error('Affinda API key not configured. Set AFFINDA_API_KEY in .env')
  const res = await fetch('https://api.affinda.com/v3/documents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText: text }),
  })
  if (!res.ok) throw new Error(`Affinda API error: ${res.status} ${res.statusText}`)
  const json = await res.json() as any
  const d = json.data ?? {}
  return {
    full_name:              d.name?.raw ?? null,
    email:                  d.emails?.[0] ?? null,
    mobile:                 d.phoneNumbers?.[0] ?? null,
    current_location:       d.location?.formatted ?? null,
    linkedin_url:           d.linkedin ?? null,
    current_designation:    d.profession ?? null,
    current_company:        d.workExperience?.[0]?.organization ?? null,
    total_experience_years: d.totalYearsExperience ?? null,
    professional_summary:   d.summary ?? null,
    skills: (d.skills ?? []).map((s: any) => ({ skill_name: s.name ?? String(s), skill_level: 'intermediate' })),
    education: (d.education ?? []).map((e: any) => ({
      qualification: e.accreditation?.educationLevel ?? 'Bachelor',
      degree:        e.accreditation?.inputStr ?? '',
      institute:     e.organization ?? '',
      passing_year:  e.dates?.completionDate ? new Date(e.dates.completionDate).getFullYear() : null,
    })),
    experience: (d.workExperience ?? []).map((w: any) => ({
      company_name:          w.organization ?? '',
      designation:           w.jobTitle ?? '',
      joining_date:          w.dates?.startDate ?? '2020-01-01',
      relieving_date:        w.dates?.endDate ?? null,
      is_current:            w.dates?.isCurrent ? 1 : 0,
      roles_responsibilities: w.jobDescription ?? null,
    })),
    certifications: [],
  }
}

uploadRouter.post('/parse-resume-file', requireCandidate, directParseUpload.single('resume'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype)
    if (!rawText.trim()) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract text from the file. Make sure the PDF has selectable text (not a scanned image).',
      })
    }

    const engine = process.env.RESUME_PARSER ?? 'claude'
    let parsed: Record<string, unknown>

    if (engine === 'affinda') {
      parsed = await parseWithAffinda(rawText)
    } else {
      const prompt = `Extract structured data from this resume and return ONLY a valid JSON object. No markdown fences, no commentary.

{
  "full_name": "string or null",
  "middle_name": "string or null",
  "last_name": "string or null",
  "email": "string or null",
  "mobile": "10-digit string or null",
  "current_location": "City, State or null",
  "linkedin_url": "full https URL or null",
  "github_url": "full https URL or null",
  "portfolio_url": "full https URL or null",
  "current_designation": "string or null",
  "current_company": "string or null",
  "total_experience_years": number or null,
  "professional_summary": "max 500 chars or null",
  "career_objective": "max 400 chars or null",
  "skills": [{"skill_name": "string", "skill_level": "beginner|intermediate|advanced|expert"}],
  "education": [{"qualification": "Bachelor|Master|PhD|Diploma|10th|12th", "degree": "string", "specialization": "string or null", "institute": "string", "university": "string or null", "passing_year": number or null, "percentage": number or null}],
  "experience": [{"company_name": "string", "designation": "string", "joining_date": "YYYY-MM-01", "relieving_date": "YYYY-MM-01 or null", "is_current": 0, "roles_responsibilities": "string or null"}],
  "certifications": [{"certification_name": "string", "issuing_organization": "string", "issue_date": "YYYY-MM-DD or null"}]
}

Rules:
- List ALL skills mentioned anywhere in the resume.
- Experience: most recent job first. Set is_current=1 only for the current employer.
- Dates: YYYY-MM-DD. If only year given, use YYYY-01-01. If month+year, use YYYY-MM-01.
- Use null for anything absent from the resume.

Resume text:
${rawText}`

      const aiText = await callClaude(prompt)
      const clean  = aiText.replace(/```json\s*|\s*```/g, '').trim()
      try { parsed = JSON.parse(clean) }
      catch { return res.status(422).json({ success: false, message: 'AI could not parse the resume. Please fill in your details manually.' }) }
    }

    res.json({ success: true, message: 'Resume parsed successfully', data: parsed })
  } catch (err: any) {
    if (err.message?.includes('AI not configured') || err.message?.includes('Affinda')) {
      return res.status(503).json({ success: false, message: err.message })
    }
    next(err)
  }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/company-media  — client company photo upload
// ════════════════════════════════════════════════════════════
uploadRouter.post('/company-media', requireAdmin, photoUpload.single('photo'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const url = fileUrl(req.file.filename)
    res.json({ success: true, message: 'Photo uploaded', data: { url } })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/upload/media  — voice / video intro
// ════════════════════════════════════════════════════════════
uploadRouter.post('/media', requireCandidate, mediaUpload.single('media'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const url      = fileUrl(req.file.filename)
    const isVideo  = req.file.mimetype.startsWith('video/')
    const duration = req.body.duration ? parseInt(req.body.duration) : null

    await db.execute(
      'UPDATE bmi_candidate SET voice_intro_url = ?, voice_intro_duration = ? WHERE id = ?',
      [url, duration, req.candidate.sub]
    )

    try {
      await db.execute(
        `INSERT INTO bmi_candidate_document
           (id, tenant_id, candidate_id, document_type, file_name, file_url, file_size_kb, mime_type, uploaded_by)
         VALUES (UUID(), ?, ?, 'other', ?, ?, ?, ?, 'candidate')`,
        [req.candidate.tenant_id, req.candidate.sub, req.file.originalname, url, Math.round(req.file.size / 1024), req.file.mimetype]
      )
    } catch {}

    res.json({
      success: true,
      message: `${isVideo ? 'Video' : 'Voice'} introduction uploaded successfully`,
      data: { url, type: isVideo ? 'video' : 'audio', duration },
    })
  } catch (err) { next(err) }
})
