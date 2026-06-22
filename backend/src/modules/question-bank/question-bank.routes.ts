import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'

export const questionBankRouter = Router()

function requirePlatformAdmin(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Admin login required' })
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    if (payload.type !== 'platform_admin') {
      return res.status(401).json({ success: false, message: 'Invalid token type' })
    }
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' })
  }
}

// ─── Zod schemas ──────────────────────────────────────────────
const createQuestionSchema = z.object({
  question_text:  z.string().min(1),
  question_type:  z.enum(['single_choice', 'multi_choice', 'true_false']).default('single_choice'),
  options:        z.array(z.string()).min(2),
  correct_answer: z.array(z.number()).min(1),
  skills:         z.array(z.string()).min(1),
  category:       z.string().nullable().optional(),
  difficulty:     z.enum(['easy', 'medium', 'hard']).default('medium'),
  marks:          z.number().int().min(1).default(1),
  explanation:    z.string().nullable().optional(),
})

const updateQuestionSchema = createQuestionSchema.partial()

// ─── GET /api/v1/question-bank/questions ──────────────────────
questionBankRouter.get('/questions', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { search, skill, category, difficulty, page = '1', limit = '50' } = req.query as any
    let where = 'q.is_active = 1'
    const params: any[] = []

    if (search) {
      where += ' AND q.question_text LIKE ?'
      params.push(`%${search}%`)
    }
    if (skill) {
      where += ' AND JSON_CONTAINS(q.skills, ?)'
      params.push(JSON.stringify(skill))
    }
    if (category) {
      where += ' AND q.category = ?'
      params.push(category)
    }
    if (difficulty) {
      where += ' AND q.difficulty = ?'
      params.push(difficulty)
    }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50))
    const offset   = (pageNum - 1) * limitNum

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT q.*,
              pa.full_name AS created_by_name
       FROM bmi_platform_question_bank q
       LEFT JOIN bmi_platform_admin pa ON pa.id = q.created_by
       WHERE ${where}
       ORDER BY q.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bmi_platform_question_bank q WHERE ${where}`,
      params
    )

    res.json({ success: true, data: { questions: rows, total, page: pageNum, limit: limitNum } })
  } catch (err) { next(err) }
})

// ─── GET /api/v1/question-bank/questions/:id ──────────────────
questionBankRouter.get('/questions/:id', requirePlatformAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT q.*, pa.full_name AS created_by_name
       FROM bmi_platform_question_bank q
       LEFT JOIN bmi_platform_admin pa ON pa.id = q.created_by
       WHERE q.id = ?`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ─── POST /api/v1/question-bank/questions ─────────────────────
questionBankRouter.post('/questions', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const body = createQuestionSchema.parse(req.body)
    const id = crypto.randomUUID()

    await db.execute(
      `INSERT INTO bmi_platform_question_bank
        (id, question_text, question_type, options, correct_answer, skills, category, difficulty, marks, explanation, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.question_text,
        body.question_type,
        JSON.stringify(body.options),
        JSON.stringify(body.correct_answer),
        JSON.stringify(body.skills),
        body.category ?? null,
        body.difficulty,
        body.marks,
        body.explanation ?? null,
        req.admin.sub,
      ]
    )

    res.status(201).json({ success: true, message: 'Question created', data: { id } })
  } catch (err) { next(err) }
})

// ─── PUT /api/v1/question-bank/questions/:id ──────────────────
questionBankRouter.put('/questions/:id', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const body = updateQuestionSchema.parse(req.body)

    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_platform_question_bank WHERE id = ?', [req.params.id]
    )
    if (!existing[0]) return res.status(404).json({ success: false, message: 'Question not found' })

    const fields: Record<string, any> = {}
    if (body.question_text !== undefined)  fields.question_text = body.question_text
    if (body.question_type !== undefined)  fields.question_type = body.question_type
    if (body.options !== undefined)        fields.options = JSON.stringify(body.options)
    if (body.correct_answer !== undefined) fields.correct_answer = JSON.stringify(body.correct_answer)
    if (body.skills !== undefined)         fields.skills = JSON.stringify(body.skills)
    if (body.category !== undefined)       fields.category = body.category
    if (body.difficulty !== undefined)     fields.difficulty = body.difficulty
    if (body.marks !== undefined)          fields.marks = body.marks
    if (body.explanation !== undefined)    fields.explanation = body.explanation

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' })
    }

    const setClauses = Object.keys(fields).map(k => `\`${k}\` = ?`).join(', ')
    await db.execute(
      `UPDATE bmi_platform_question_bank SET ${setClauses} WHERE id = ?`,
      [...Object.values(fields), req.params.id]
    )

    res.json({ success: true, message: 'Question updated' })
  } catch (err) { next(err) }
})

// ─── DELETE /api/v1/question-bank/questions/:id (soft delete) ─
questionBankRouter.delete('/questions/:id', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_platform_question_bank WHERE id = ?', [_req.params.id]
    )
    if (!existing[0]) return res.status(404).json({ success: false, message: 'Question not found' })

    await db.execute(
      'UPDATE bmi_platform_question_bank SET is_active = 0 WHERE id = ?',
      [_req.params.id]
    )

    res.json({ success: true, message: 'Question deleted' })
  } catch (err) { next(err) }
})

// ─── POST /api/v1/question-bank/questions/bulk-import ─────────
questionBankRouter.post('/questions/bulk-import', requirePlatformAdmin, async (req: any, res, next) => {
  try {
    const bulkSchema = z.object({
      questions: z.array(createQuestionSchema).min(1).max(500),
    })
    const { questions } = bulkSchema.parse(req.body)
    const results: { index: number; id: string }[] = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const id = crypto.randomUUID()
      await db.execute(
        `INSERT INTO bmi_platform_question_bank
          (id, question_text, question_type, options, correct_answer, skills, category, difficulty, marks, explanation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, q.question_text, q.question_type,
          JSON.stringify(q.options), JSON.stringify(q.correct_answer),
          JSON.stringify(q.skills), q.category ?? null,
          q.difficulty, q.marks, q.explanation ?? null,
          req.admin.sub,
        ]
      )
      results.push({ index: i, id })
    }

    res.status(201).json({ success: true, message: `${results.length} questions imported`, data: { imported: results.length } })
  } catch (err) { next(err) }
})

// ─── GET /api/v1/question-bank/skills ─────────────────────────
questionBankRouter.get('/skills', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT skills FROM bmi_platform_question_bank WHERE is_active = 1`
    )
    const skillSet = new Set<string>()
    for (const row of rows) {
      let arr: string[] = []
      try {
        arr = typeof row.skills === 'string' ? JSON.parse(row.skills) : (Array.isArray(row.skills) ? row.skills : [])
      } catch { arr = [] }
      for (const s of arr) skillSet.add(s)
    }
    const skills = Array.from(skillSet).sort()
    res.json({ success: true, data: skills })
  } catch (err) { next(err) }
})

// ─── GET /api/v1/question-bank/categories ─────────────────────
questionBankRouter.get('/categories', requirePlatformAdmin, async (_req, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT category FROM bmi_platform_question_bank WHERE is_active = 1 AND category IS NOT NULL ORDER BY category ASC`
    )
    const categories = rows.map(r => r.category)
    res.json({ success: true, data: categories })
  } catch (err) { next(err) }
})
