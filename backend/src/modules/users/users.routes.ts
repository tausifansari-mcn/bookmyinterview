import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js'
import { sendWelcomeEmail } from '../../services/email.service.js'

export const usersRouter = Router()
usersRouter.use(requireAuth)

const ROLES = ['super_admin', 'admin', 'hr_manager', 'recruiter', 'interviewer', 'hiring_manager', 'viewer'] as const

// ── helpers ──────────────────────────────────────────────────
function canManage(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'super_admin') return true
  if (actorRole === 'admin' && targetRole !== 'super_admin') return true
  return false
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd + '@1'   // satisfies typical complexity rules
}

// ════════════════════════════════════════════════════════════
// GET /api/v1/users  — list all team members
// ════════════════════════════════════════════════════════════
usersRouter.get('/', requireRole('admin', 'hr_manager'), async (req: AuthRequest, res, next) => {
  try {
    const { role: filterRole, search } = req.query as Record<string, string>
    let sql = `
      SELECT id, email, full_name, mobile, role, avatar_url,
             is_blocked, must_change_password, last_login_at, created_at
      FROM bmi_user
      WHERE tenant_id = ?`
    const params: any[] = [req.user!.tenant_id]

    if (filterRole) { sql += ' AND role = ?'; params.push(filterRole) }
    if (search)     { sql += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

    sql += ' ORDER BY FIELD(role,"super_admin","admin","hr_manager","recruiter","interviewer","hiring_manager","viewer"), full_name'

    const [rows] = await db.execute<RowDataPacket[]>(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/users  — create new team member
// ════════════════════════════════════════════════════════════
usersRouter.post('/', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      full_name: z.string().min(2),
      email:     z.string().email(),
      password:  z.string().min(8).optional(),
      role:      z.enum(ROLES),
      mobile:    z.string().optional(),
    }).parse(req.body)

    // Only super_admin can create super_admin users
    if (body.role === 'super_admin' && req.user!.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can create another Super Admin' })
    }

    // Check email uniqueness in tenant
    const [dup] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM bmi_user WHERE tenant_id = ? AND email = ?',
      [req.user!.tenant_id, body.email]
    )
    if (dup.length) return res.status(409).json({ success: false, message: 'A user with this email already exists' })

    const tempPassword = body.password ?? generateTempPassword()
    const hash         = await bcrypt.hash(tempPassword, 10)
    const id           = randomUUID()

    await db.execute(
      `INSERT INTO bmi_user (id, tenant_id, email, password_hash, full_name, mobile, role, is_blocked, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, req.user!.tenant_id, body.email, hash, body.full_name, body.mobile ?? null, body.role, body.password ? 0 : 1]
    )

    // Send welcome email with temp password
    try {
      await sendWelcomeEmail(body.email, body.full_name, tempPassword)
    } catch {}

    res.status(201).json({
      success: true,
      message: `User created. ${body.password ? 'Login credentials set.' : `Temporary password sent to ${body.email}.`}`,
      data: { id, email: body.email, full_name: body.full_name, role: body.role, temp_password: body.password ? undefined : tempPassword },
    })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// GET /api/v1/users/:id  — get single user
// ════════════════════════════════════════════════════════════
usersRouter.get('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, email, full_name, mobile, role, avatar_url, is_blocked, must_change_password, last_login_at, created_at
       FROM bmi_user WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// PUT /api/v1/users/:id  — update user
// ════════════════════════════════════════════════════════════
usersRouter.put('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      full_name:  z.string().min(2).optional(),
      role:       z.enum(ROLES).optional(),
      mobile:     z.string().optional().nullable(),
      is_blocked: z.coerce.number().int().min(0).max(1).optional(),
    }).parse(req.body)

    const [target] = await db.execute<RowDataPacket[]>(
      'SELECT id, role FROM bmi_user WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    if (!target[0]) return res.status(404).json({ success: false, message: 'User not found' })

    // Permission checks
    if (!canManage(req.user!.role, target[0].role)) {
      return res.status(403).json({ success: false, message: 'You cannot modify a Super Admin account' })
    }
    if (req.params.id === req.user!.id && body.role && body.role !== req.user!.role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' })
    }
    if (body.role === 'super_admin' && req.user!.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can assign Super Admin role' })
    }

    const sets: string[] = []
    const params: any[]  = []
    if (body.full_name  !== undefined) { sets.push('full_name = ?');  params.push(body.full_name) }
    if (body.role       !== undefined) { sets.push('role = ?');       params.push(body.role) }
    if (body.mobile     !== undefined) { sets.push('mobile = ?');     params.push(body.mobile) }
    if (body.is_blocked !== undefined) { sets.push('is_blocked = ?'); params.push(body.is_blocked) }

    if (!sets.length) return res.status(400).json({ success: false, message: 'No fields to update' })
    params.push(req.params.id, req.user!.tenant_id)
    await db.execute(`UPDATE bmi_user SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`, params)

    res.json({ success: true, message: 'User updated successfully' })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// POST /api/v1/users/:id/reset-password  — set new temp password
// ════════════════════════════════════════════════════════════
usersRouter.post('/:id/reset-password', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const [target] = await db.execute<RowDataPacket[]>(
      'SELECT id, email, full_name, role FROM bmi_user WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    if (!target[0]) return res.status(404).json({ success: false, message: 'User not found' })
    if (!canManage(req.user!.role, target[0].role)) {
      return res.status(403).json({ success: false, message: 'You cannot reset a Super Admin password' })
    }

    const { new_password } = req.body
    const tempPassword = new_password?.trim() || generateTempPassword()
    if (tempPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const hash = await bcrypt.hash(tempPassword, 10)
    await db.execute(
      'UPDATE bmi_user SET password_hash = ?, must_change_password = 1 WHERE id = ?',
      [hash, req.params.id]
    )

    try { await sendWelcomeEmail(target[0].email, target[0].full_name, tempPassword) } catch {}

    res.json({
      success: true,
      message: `Password reset. New temporary password sent to ${target[0].email}.`,
      data: { temp_password: tempPassword },
    })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════
// DELETE /api/v1/users/:id  — delete team member (super_admin only)
// ════════════════════════════════════════════════════════════
usersRouter.delete('/:id', requireRole('super_admin'), async (req: AuthRequest, res, next) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' })
    }
    const [target] = await db.execute<RowDataPacket[]>(
      'SELECT id, full_name FROM bmi_user WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user!.tenant_id]
    )
    if (!target[0]) return res.status(404).json({ success: false, message: 'User not found' })

    await db.execute('DELETE FROM bmi_user WHERE id = ? AND tenant_id = ?', [req.params.id, req.user!.tenant_id])
    res.json({ success: true, message: `${target[0].full_name} has been removed from the team` })
  } catch (err) { next(err) }
})
