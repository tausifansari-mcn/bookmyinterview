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
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },  // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a',
      'audio/webm', 'video/mp4', 'video/webm', 'video/quicktime',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
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

// ── PDF text extractor ───────────────────────────────────────
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const buffer   = fs.readFileSync(filePath)
    const result   = await pdfParse(buffer)
    return result.text?.slice(0, 6000) ?? ''
  } catch {
    return ''
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
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT resume_text, full_name, email, mobile FROM bmi_candidate WHERE id = ?',
      [req.candidate.sub]
    )
    const candidate = rows[0]
    if (!candidate?.resume_text) {
      return res.status(400).json({ success: false, message: 'No resume text found. Please upload a PDF resume first.' })
    }

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
${candidate.resume_text}

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
      return res.status(503).json({ success: false, message: 'AI service not configured. Please fill the form manually.' })
    }
    next(err)
  }
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
