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

// Memory storage for media — file buffer stored directly in MySQL LONGBLOB
const mediaStorage = multer.memoryStorage()

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
  limits: { fileSize: 50 * 1024 * 1024 },  // 50 MB
  fileFilter: (_req, file, cb) => {
    // Strip codec params (e.g. 'video/webm;codecs=vp8,opus' → 'video/webm')
    const base = (file.mimetype ?? '').split(';')[0].trim().toLowerCase()
    // Accept any audio or video type, plus octet-stream (browser fallback for blobs)
    if (base.startsWith('audio/') || base.startsWith('video/') || base === 'application/octet-stream') {
      cb(null, true)
    } else {
      cb(new Error('Only audio and video files are allowed'))
    }
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
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const emailMatch    = text.match(/[\w.+%-]+@[\w.-]+\.[a-zA-Z]{2,6}/)
  const mobileMatch   = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/)
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w%-]+)/i)
  const githubMatch   = text.match(/github\.com\/([\w-]+)/i)
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.(?:com|in|io|dev|app|me|net|org)(?:\/[\w-]*)?)/i)

  // ── Name extraction ───────────────────────────────────────
  // Heuristic: first 1-3 lines that are 2-5 words, all capitalized, not a header
  let fullName: string | null = null
  const sectionHeaders = /^(summary|profile|objective|education|experience|skills|certifications|languages|projects|achievements|contact|references|about|work|technical|professional)/i
  for (const line of lines.slice(0, 8)) {
    const cleaned = line.replace(/[^a-zA-Z\s.-]/g, '').trim()
    const words = cleaned.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 5) {
      // Check if all words start with uppercase or are common name parts
      const allNamed = words.every(w => /^[A-Z]/.test(w) || /^(?:de|da|do|van|von|mc|mac|o')/i.test(w))
      const hasNumber = /\d/.test(cleaned)
      if (allNamed && !hasNumber && !sectionHeaders.test(cleaned)) {
        fullName = cleaned
        break
      }
    }
  }
  // Fallback: look for "Name:" pattern
  if (!fullName) {
    const nameLabel = text.match(/(?:name\s*[:.]?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/i)
    if (nameLabel) fullName = nameLabel[1].trim()
  }

  // ── Known skills dictionary ───────────────────────────────
  const knownSkills = [
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'c', 'ruby', 'php', 'go', 'golang',
    'rust', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'dart', 'elixir', 'clojure',
    'react', 'react.js', 'reactjs', 'angular', 'angularjs', 'vue', 'vue.js', 'vuejs', 'svelte',
    'next.js', 'nextjs', 'nuxt.js', 'nuxtjs', 'node.js', 'nodejs', 'express', 'express.js',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'asp.net', 'rails', 'laravel',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'bootstrap', 'material-ui',
    'jquery', 'redux', 'graphql', 'rest api', 'restful', 'webpack', 'vite', 'babel', 'gulp',
    'docker', 'kubernetes', 'k8s', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
    'terraform', 'ansible', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'bitbucket',
    'linux', 'unix', 'bash', 'powershell', 'nginx', 'apache', 'redis', 'mongodb',
    'postgresql', 'postgres', 'mysql', 'sql', 'sqlite', 'mariadb', 'oracle', 'sql server',
    'nosql', 'firebase', 'supabase', 'elasticsearch', 'kafka', 'rabbitmq', 'websocket',
    'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'nlp', 'computer vision',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'data science',
    'agile', 'scrum', 'jira', 'confluence', 'figma', 'sketch', 'adobe xd', 'photoshop',
    'illustrator', 'ui/ux', 'user interface', 'user experience', 'responsive design',
    'unit testing', 'jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium',
    'excel', 'powerpoint', 'word', 'outlook', 'microsoft office', 'google sheets',
    'tableau', 'power bi', 'looker', 'snowflake', 'bigquery', 'hadoop', 'spark',
    'blockchain', 'solidity', 'web3', 'smart contracts', 'ethereum',
    'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
    'project management', 'time management', 'critical thinking', 'creativity',
  ]

  const textLower = text.toLowerCase()
  const foundSkills: { skill_name: string; skill_level: string }[] = []
  const matched = new Set<string>()
  for (const skill of knownSkills) {
    if (matched.has(skill)) continue
    const escaped = skill.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(textLower)) {
      const skillName = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const level = textLower.includes(`expert`) && textLower.includes(skill) ? 'expert'
                  : textLower.includes(`advanced`) && textLower.includes(skill) ? 'advanced'
                  : 'intermediate'
      foundSkills.push({ skill_name: skillName, skill_level: level })
      matched.add(skill)
    }
  }
  // Deduplicate by normalised name
  const deduped: { skill_name: string; skill_level: string }[] = []
  const seen = new Set<string>()
  for (const s of foundSkills) {
    const key = s.skill_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) { seen.add(key); deduped.push(s) }
  }

  // ── Education extraction ──────────────────────────────────
  const degrees = [
    { qual: 'PhD',       pattern: /(ph\.?\s*d\.?|phd|doctorate)/i },
    { qual: 'Master',    pattern: /(m\.?\s*tech\.?|m\.?\s*s\.?|mba|master\s*(?:of|in)?|msc|m\.?\s*sc\.?)/i },
    { qual: 'Bachelor',  pattern: /(b\.?\s*tech\.?|b\.?\s*e\.?|bachelor\s*(?:of|in)?|b\.?\s*sc\.?|b\.?\s*a\.?|bca|bba)/i },
    { qual: 'Diploma',   pattern: /(diploma|pgd|post\s*graduate\s*dip)/i },
    { qual: '12th',      pattern: /(12th|xii|hsc|higher\s*secondary|intermediate)/i },
    { qual: '10th',      pattern: /(10th|x|ssc|matriculation)/i },
  ]
  const education: any[] = []
  const seenEdu = new Set<string>()
  for (const line of lines) {
    for (const { qual, pattern } of degrees) {
      const m = line.match(pattern)
      if (m) {
        const key = qual + line.slice(0, 40).toLowerCase()
        if (seenEdu.has(key)) continue
        seenEdu.add(key)
        const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/)
        const pctMatch  = line.match(/(\d{1,2}(?:\.\d)?)\s*%/)
        const cgpaMatch = line.match(/(\d\.\d)\s*cgpa/i)
        education.push({
          qualification: qual,
          degree:        m[0].replace(/\./g, '').trim().toUpperCase(),
          specialization: null,
          institute:     line.replace(/\d{4}/g, '').replace(/\d{1,2}\s*%/g, '').replace(/cgpa[\s\d.]+/i, '').replace(pattern, '').replace(/[,;:|()]/g, '').trim() || null,
          university:    null,
          passing_year:  yearMatch ? parseInt(yearMatch[1]) : null,
          percentage:    pctMatch ? parseFloat(pctMatch[1]) : null,
        })
        break
      }
    }
  }

  // ── Experience extraction ─────────────────────────────────
  const experience: any[] = []
  // Look for date ranges like "Jan 2020 - Present" or "2020-2023" or "2020 - 2023"
  const dateRangeRegex = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}|\b\d{4})\s*[–\-to]+\s*(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}|present|current|\b\d{4})/gi
  const jobTitleKeywords = /(?:engineer|developer|designer|manager|analyst|consultant|lead|architect|administrator|specialist|associate|coordinator|director|head|supervisor|officer|trainee|intern)\b/i
  let dateMatch: RegExpExecArray | null
  while ((dateMatch = dateRangeRegex.exec(text)) !== null) {
    const startRaw = dateMatch[1].trim()
    const endRaw   = dateMatch[2].trim().toLowerCase()
    const isCurrent = endRaw === 'present' || endRaw === 'current'
    const contextStart = Math.max(0, dateMatch.index - 120)
    const contextEnd   = Math.min(text.length, dateMatch.index + dateMatch[0].length + 80)
    const context = text.slice(contextStart, contextEnd)
    const linesBefore = context.split('\n').filter(Boolean)
    let company = ''
    let title = ''
    for (const cl of linesBefore) {
      if (!title && jobTitleKeywords.test(cl)) {
        title = cl.replace(/[–\-to]+\s*(?:present|current|\d{4})/gi, '').trim().slice(0, 100)
      }
      // Company often on a line before the title or on the same line
      if (cl.length > 2 && cl.length < 100 && /^[A-Z]/.test(cl.trim()) && !jobTitleKeywords.test(cl) && cl !== startRaw) {
        company = cl.trim()
      }
    }
    // Only add if we found a title or company
    if (title || company) {
      const joiningDate = normalizeDate(startRaw)
      const relievingDate = isCurrent ? null : normalizeDate(endRaw === 'present' ? '' : dateMatch[2])
      // Check if we already captured this experience
      const exists = experience.some(e => e.company_name === company && e.joining_date === joiningDate)
      if (!exists) {
        experience.push({
          company_name:          company || 'Unknown',
          designation:           title || 'Unknown',
          joining_date:          joiningDate || '2020-01-01',
          relieving_date:        relievingDate,
          is_current:            isCurrent ? 1 : 0,
          roles_responsibilities: context.replace(dateRangeRegex, '').trim().slice(0, 300) || null,
        })
      }
    }
  }

  // ── Certifications extraction ─────────────────────────────
  const certKeywords = /(certification|certified|certificate|coursera|udemy|aws certified|google certified|microsoft certified|oracle certified|pmp|itil|scrum|six sigma|ccna|ceh|cissp|comptia)/i
  const certifications: any[] = []
  for (const line of lines) {
    if (certKeywords.test(line) && line.length < 200) {
      const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/)
      certifications.push({
        certification_name:    line.replace(/\d{4}/g, '').replace(/[,;]/g, '').trim().slice(0, 150),
        issuing_organization:  null,
        issue_date:            yearMatch ? `${yearMatch[1]}-01-01` : null,
      })
    }
  }

  // ── Languages extraction ──────────────────────────────────
  const knownLanguages = ['english', 'hindi', 'spanish', 'french', 'german', 'mandarin', 'japanese',
    'korean', 'portuguese', 'italian', 'dutch', 'russian', 'arabic', 'bengali', 'tamil', 'telugu',
    'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu', 'odia', 'assamese']
  const languages: any[] = []
  for (const lang of knownLanguages) {
    const langRegex = new RegExp(`\\b${lang}\\b`, 'i')
    if (langRegex.test(textLower)) {
      const prof = textLower.includes('native') && textLower.includes(lang) ? 'native'
                 : textLower.includes('fluent') && textLower.includes(lang) ? 'fluent'
                 : textLower.includes('proficient') && textLower.includes(lang) ? 'proficient'
                 : 'conversational'
      const exists = languages.some(l => l.language.toLowerCase() === lang)
      if (!exists) languages.push({ language: lang.charAt(0).toUpperCase() + lang.slice(1), proficiency: prof })
    }
  }

  // ── Location extraction (crude) ───────────────────────────
  const locationMatch = text.match(/(?:location|address|city|based\s*(?:in|at))\s*[:.]?\s*([A-Za-z\s,]+)/i)
  const currentLocation = locationMatch?.[1]?.trim() ?? null

  // ── Current company / designation ─────────────────────────
  let currentCompany = null
  let currentDesignation = null
  for (const exp of experience) {
    if (exp.is_current) {
      currentCompany = exp.company_name
      currentDesignation = exp.designation
      break
    }
  }
  if (!currentCompany) {
    const workMatch = text.match(/(?:currently|presently)\s+working\s+(?:as\s+a\s+)?(?:at|in|with)\s+([A-Z][A-Za-z\s&.]+)/i)
    if (workMatch) currentCompany = workMatch[1].trim()
    const desigMatch = text.match(/(?:currently|presently)\s+(?:working\s+as\s+)?(?:a\s+|an\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i)
    if (desigMatch) currentDesignation = desigMatch[1].trim()
  }

  // ── Highest education ─────────────────────────────────────
  const highestEducation = education.length > 0
    ? (education.find((e: any) => e.qualification === 'PhD')
    || education.find((e: any) => e.qualification === 'Master')
    || education.find((e: any) => e.qualification === 'Bachelor')
    || education.find((e: any) => e.qualification === 'Diploma')
    || education[0])?.degree ?? null
    : null

  // ── Total experience years ────────────────────────────────
  let totalExpYears: number | null = null
  const expYearMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)/i)
  if (expYearMatch) totalExpYears = parseInt(expYearMatch[1])

  function normalizeDate(raw: string): string | null {
    if (!raw || raw.toLowerCase() === 'present' || raw.toLowerCase() === 'current') return null
    const d = raw.match(/\b(\d{4})\b/)
    if (d) return `${d[1]}-01-01`
    return null
  }

  return {
    full_name: fullName,
    email: emailMatch?.[0] ?? null,
    mobile: mobileMatch?.[0]?.replace(/\D/g, '').slice(-10) ?? null,
    linkedin_url: linkedinMatch ? `https://www.linkedin.com/in/${linkedinMatch[1]}` : null,
    github_url:   githubMatch   ? `https://github.com/${githubMatch[1]}`            : null,
    portfolio_url: portfolioMatch ? portfolioMatch[0] : null,
    current_company: currentCompany,
    current_designation: currentDesignation,
    total_experience_years: totalExpYears,
    current_location: currentLocation,
    highest_education: highestEducation,
    professional_summary: null,
    career_objective: null,
    skills: deduped,
    education,
    experience,
    certifications,
    languages,
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
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = await import('mammoth')
        const result = await (mammoth as any).extractRawText({ path: req.file.path })
        resumeText = ((result as any).value ?? '').slice(0, 8000)
      } catch {}
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
  "alternate_email": "string or null",
  "gender": "string or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "nationality": "string or null",
  "linkedin_url": "string or null",
  "github_url": "string or null",
  "portfolio_url": "string or null",
  "current_company": "string or null",
  "current_designation": "string or null",
  "total_experience_years": "number or null",
  "current_location": "string or null",
  "current_city": "string or null",
  "current_state": "string or null",
  "current_country": "string or null",
  "professional_summary": "string (max 500 chars) or null",
  "career_objective": "string (max 500 chars) or null",
  "highest_education": "string or null",
  "skills": [{"skill_name": "string", "skill_level": "beginner|intermediate|advanced|expert"}],
  "education": [{"qualification": "string", "degree": "string", "specialization": "string or null", "institute": "string", "university": "string or null", "passing_year": "number or null", "percentage": "number or null"}],
  "experience": [{"company_name": "string", "designation": "string", "joining_date": "YYYY-MM-DD", "relieving_date": "YYYY-MM-DD or null", "is_current": 0 or 1, "roles_responsibilities": "string or null"}],
  "certifications": [{"certification_name": "string", "issuing_organization": "string", "issue_date": "YYYY-MM-DD or null"}],
  "languages": [{"language": "string", "proficiency": "basic|conversational|fluent|native"}]
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
    let parser: any
    try {
      const { PDFParse } = await import('pdf-parse') as any
      parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      return (result.text ?? '').slice(0, 8000)
    } catch { return '' }
    finally { await parser?.destroy?.() }
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
// POST /api/v1/upload/media  — voice / video intro (stored as LONGBLOB in DB)
// ════════════════════════════════════════════════════════════
uploadRouter.post('/media', requireCandidate, mediaUpload.single('media'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const mime     = (req.file.mimetype ?? '').split(';')[0].trim().toLowerCase()
    const ext      = path.extname(req.file.originalname).toLowerCase() || '.webm'
    const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg'])
    const isVideo  = mime.startsWith('video/') || (mime === 'application/octet-stream' && VIDEO_EXTS.has(ext))
    const duration = req.body.duration ? parseInt(req.body.duration) : null
    const candidateId = req.candidate.sub

    // Build a serve URL that encodes type via prefix (keeps frontend player detection working)
    const serveUrl = `/api/v1/upload/intro/${isVideo ? 'video' : 'audio'}-${candidateId}`

    await db.execute(
      'UPDATE bmi_candidate SET voice_intro_url = ?, voice_intro_duration = ?, voice_intro_data = ?, voice_intro_mime = ? WHERE id = ?',
      [serveUrl, duration, req.file.buffer, mime || (isVideo ? 'video/webm' : 'audio/webm'), candidateId]
    )

    res.json({
      success: true,
      message: `${isVideo ? 'Video' : 'Voice'} introduction uploaded successfully`,
      data: { url: serveUrl, type: isVideo ? 'video' : 'audio', duration },
    })
  } catch (err) { next(err) }
})

// GET /api/v1/upload/intro/:id  — serve voice/video intro from DB (public, UUID-protected)
// id format: "video-<candidateId>" or "audio-<candidateId>"
uploadRouter.get('/intro/:id', async (req: any, res, next) => {
  try {
    const { id } = req.params
    const candidateId = id.replace(/^(video|audio)-/, '')
    if (!candidateId || candidateId === id) {
      return res.status(400).json({ success: false, message: 'Invalid media ID' })
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT voice_intro_data, voice_intro_mime FROM bmi_candidate WHERE id = ?',
      [candidateId]
    )
    const row = rows[0]
    if (!row || !row.voice_intro_data) {
      return res.status(404).json({ success: false, message: 'Media not found' })
    }

    const mime = row.voice_intro_mime || (id.startsWith('video-') ? 'video/webm' : 'audio/webm')
    const buf: Buffer = Buffer.isBuffer(row.voice_intro_data)
      ? row.voice_intro_data
      : Buffer.from(row.voice_intro_data)

    res.set('Content-Type', mime)
    res.set('Content-Length', String(buf.length))
    res.set('Accept-Ranges', 'bytes')
    res.set('Cache-Control', 'private, max-age=86400')
    res.send(buf)
  } catch (err) { next(err) }
})
