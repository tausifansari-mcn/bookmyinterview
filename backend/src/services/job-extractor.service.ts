export interface ExtractedJobData {
  title?: string
  description?: string
  requirements?: string
  responsibilities?: string
  skills_required?: string[]
  experience_min_years?: number
  experience_max_years?: number
  job_type?: string
  work_mode?: string
  salary_min?: number
  salary_max?: number
  location_city?: string
}

// ── AI helper ────────────────────────────────────────────────
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

async function extractWithAI(text: string, fileName: string): Promise<ExtractedJobData> {
  const prompt = `You are a professional job description parser. Extract structured information from the JD text below.

Return ONLY a valid JSON object with these exact keys (use null for missing fields):
{
  "title": "job title string or null",
  "description": "full job description string or null",
  "requirements": "requirements string or null",
  "responsibilities": "responsibilities string or null",
  "skills_required": ["skill1", "skill2"],
  "experience_min_years": number or null,
  "experience_max_years": number or null,
  "job_type": "full_time|part_time|contract|internship or null",
  "work_mode": "onsite|remote|hybrid or null",
  "salary_min": number (in rupees per year) or null,
  "salary_max": number (in rupees per year) or null,
  "location_city": "city name or null"
}

Rules:
- job_type: map to one of full_time, part_time, contract, internship
- work_mode: map to one of onsite, remote, hybrid
- salary: return in rupees per year (e.g. 12 LPA = 1200000)
- skills_required: list ALL skills mentioned, max 30
- description: the full job description text
- requirements: qualifications and must-haves
- responsibilities: what the role entails

File name: ${fileName}

JD Text:
${text.slice(0, 6000)}

Return ONLY the JSON object. No explanation, no markdown, no code blocks.`

  const aiResponse = await callClaude(prompt)
  const clean = aiResponse.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('AI could not parse the JD')
  }
}

const INDIAN_CITIES = [
  'mumbai','delhi','bangalore','bengaluru','hyderabad','chennai','kolkata','pune',
  'ahmedabad','jaipur','surat','lucknow','kanpur','nagpur','indore','thane',
  'bhopal','visakhapatnam','pimpri','patna','vadodara','ghaziabad','ludhiana',
  'agra','nashik','faridabad','meerut','rajkot','varanasi','srinagar','aurangabad',
  'dhanbad','amritsar','navi mumbai','allahabad','ranchi','howrah','coimbatore',
  'jabalpur','gwalior','vijayawada','jodhpur','madurai','raipur','kota','guwahati',
  'chandigarh','noida','gurugram','gurgaon','mysore','mysuru',
]

function extractTitle(text: string): string | undefined {
  const patterns = [
    /(?:job\s+title|position|role)\s*[:\-]\s*(.+)/i,
    /^([A-Z][^\n]{5,80})$/m,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim().slice(0, 150)
  }
  const firstLine = text.split('\n').find(l => l.trim().length > 5 && l.trim().length < 120)
  return firstLine?.trim()
}

function extractSkills(text: string): string[] {
  const skillSectionMatch = text.match(
    /(?:required\s+skills?|skills?\s+required|technologies|tech\s+stack|key\s+skills?|qualifications?|requirements?)\s*[:\-]?\s*([\s\S]{0,800}?)(?:\n\n|\n[A-Z]|$)/i
  )
  if (!skillSectionMatch) return []
  const raw = skillSectionMatch[1]
  const items = raw
    .split(/[,\n•\-*\/]/)
    .map(s => s.replace(/^\s*[\d.]+\s*/, '').trim())
    .filter(s => s.length >= 2 && s.length <= 60 && !/^(and|or|the|with|using|in|for|of|to|a|an)$/i.test(s))
  return [...new Set(items)].slice(0, 20)
}

function extractExperience(text: string): { min?: number; max?: number } {
  const m = text.match(/(\d+)\+?\s*(?:to\s*|-\s*)(\d+)\s*(?:years?|yrs?)/i)
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) }
  const m2 = text.match(/(\d+)\+\s*(?:years?|yrs?)/i)
  if (m2) return { min: parseInt(m2[1]) }
  const m3 = text.match(/(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i)
  if (m3) return { min: parseInt(m3[1]) }
  return {}
}

function extractJobType(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (/\bfull[\s-]?time\b/.test(lower)) return 'full_time'
  if (/\bpart[\s-]?time\b/.test(lower)) return 'part_time'
  if (/\bcontract\b/.test(lower)) return 'contract'
  if (/\binternship\b/.test(lower)) return 'internship'
  return undefined
}

function extractWorkMode(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (/\bhybrid\b/.test(lower)) return 'hybrid'
  if (/\bremote\b/.test(lower)) return 'remote'
  if (/\bon[\s-]?site\b|\bonsite\b/.test(lower)) return 'onsite'
  return undefined
}

function extractSalary(text: string): { min?: number; max?: number } {
  // "X-Y LPA" or "X to Y LPA"
  const m1 = text.match(/(?:₹\s*)?(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?(?:\s*per\s*annum)?)/i)
  if (m1) return { min: parseFloat(m1[1]) * 100000, max: parseFloat(m1[2]) * 100000 }
  // "X LPA"
  const m2 = text.match(/(?:₹\s*)?(\d+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?(?:\s*per\s*annum)?)/i)
  if (m2) return { min: parseFloat(m2[1]) * 100000 }
  // "X-Y L"
  const m3 = text.match(/(?:₹\s*)?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*[Ll]\b/)
  if (m3) return { min: parseFloat(m3[1]) * 100000, max: parseFloat(m3[2]) * 100000 }
  return {}
}

function extractLocation(text: string): string | undefined {
  const lower = text.toLowerCase()
  return INDIAN_CITIES.find(city => {
    const re = new RegExp(`\\b${city}\\b`, 'i')
    return re.test(lower)
  })
}

function extractSection(text: string, headers: string[]): string | undefined {
  const pattern = new RegExp(
    `(?:${headers.join('|')})[:\\s]*([\\s\\S]{50,1500}?)(?=\\n[A-Z][^\\n]{0,60}\\n|\\n\\n[A-Z]|$)`,
    'i'
  )
  const m = text.match(pattern)
  return m?.[1]?.trim().slice(0, 1500)
}

export async function extractJobFromFile(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<ExtractedJobData> {
  let text = ''

  if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
    try {
      const mod = await import('pdf-parse')
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (mod as any).default ?? mod
      const result = await pdfParse(buffer)
      text = result.text ?? ''
    } catch {
      text = ''
    }
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || originalname.toLowerCase().endsWith('.docx')
  ) {
    try {
      const mammoth = await import('mammoth')
      const result = await (mammoth as any).extractRawText({ buffer })
      text = ((result as any).value ?? '').slice(0, 8000)
    } catch {
      text = ''
    }
  } else {
    // Plain text fallback
    text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ')
  }

  if (!text || text.trim().length < 20) return {}

  // Try AI extraction first, fall back to regex
  try {
    const aiResult = await extractWithAI(text, originalname)
    // Only use AI result if we got at least a title or skills
    if (aiResult.title || (aiResult.skills_required && aiResult.skills_required.length > 0)) {
      return aiResult
    }
  } catch {}

  // Regex fallback
  const exp = extractExperience(text)
  const salary = extractSalary(text)
  const skills = extractSkills(text)
  const description = text.slice(0, 1500).trim()
  const responsibilities = extractSection(text, [
    'responsibilities','key duties','duties','what you will do','your role','job description',
  ])
  const requirements = extractSection(text, [
    'requirements','qualifications','what we look for','what you need','must have',
  ])

  return {
    title: extractTitle(text),
    description,
    requirements,
    responsibilities,
    skills_required: skills.length > 0 ? skills : undefined,
    experience_min_years: exp.min,
    experience_max_years: exp.max,
    job_type: extractJobType(text),
    work_mode: extractWorkMode(text),
    salary_min: salary.min,
    salary_max: salary.max,
    location_city: extractLocation(text),
  }
}
