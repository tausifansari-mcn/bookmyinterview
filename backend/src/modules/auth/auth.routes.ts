import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2'
import { authService } from './auth.service.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.js'
import { db } from '../../db/mysql.js'
import { sendAdminOTPEmail } from '../../services/email.service.js'

export const authRouter = Router()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const data = await authService.login(email, password)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = await authService.me(req.user!.id)
    if (!data) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await authService.logout(req.user!.id)
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

// ─── ADMIN FORGOT PASSWORD — Send OTP ────────────────────────
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.id, u.full_name, u.email, u.is_blocked, u.tenant_id
       FROM bmi_user u WHERE u.email = ? LIMIT 1`,
      [email]
    )

    // Always return success to prevent email enumeration
    if (!rows[0] || rows[0].is_blocked) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' })
    }

    const user = rows[0]
    const otp      = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash  = await bcrypt.hash(otp, 10)
    const expires  = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete old OTPs for this user
    await db.execute('DELETE FROM bmi_admin_otp WHERE user_id = ?', [user.id])
    await db.execute(
      `INSERT INTO bmi_admin_otp (id, user_id, tenant_id, otp_hash, expires_at)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [user.id, user.tenant_id, otpHash, expires]
    )

    await sendAdminOTPEmail(user.email, user.full_name, otp)

    res.json({ success: true, message: 'OTP sent to your registered email address.' })
  } catch (err) {
    next(err)
  }
})

// ─── ADMIN RESET PASSWORD — Verify OTP + Set New Password ────
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const body = z.object({
      email:        z.string().email(),
      otp:          z.string().length(6),
      new_password: z.string().min(8, 'Password must be at least 8 characters'),
    }).parse(req.body)

    const [userRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, full_name FROM bmi_user WHERE email = ? LIMIT 1',
      [body.email]
    )
    if (!userRows[0]) {
      const e: any = new Error('Invalid or expired OTP.'); e.status = 400; throw e
    }

    const user = userRows[0]
    const [otpRows] = await db.execute<RowDataPacket[]>(
      `SELECT id, otp_hash, expires_at, attempts, used
       FROM bmi_admin_otp WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    )

    const otpRecord = otpRows[0]
    if (!otpRecord || otpRecord.used) {
      const e: any = new Error('No active OTP found. Please request a new one.'); e.status = 400; throw e
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await db.execute('DELETE FROM bmi_admin_otp WHERE id = ?', [otpRecord.id])
      const e: any = new Error('OTP has expired. Please request a new one.'); e.status = 400; throw e
    }

    if (otpRecord.attempts >= 5) {
      await db.execute('DELETE FROM bmi_admin_otp WHERE id = ?', [otpRecord.id])
      const e: any = new Error('Maximum OTP attempts exceeded. Please request a new OTP.'); e.status = 400; throw e
    }

    const valid = await bcrypt.compare(body.otp, otpRecord.otp_hash)
    if (!valid) {
      await db.execute('UPDATE bmi_admin_otp SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id])
      const remaining = 5 - (otpRecord.attempts + 1)
      const e: any = new Error(`Incorrect OTP. ${remaining} attempt(s) remaining.`); e.status = 400; throw e
    }

    // Valid OTP — update password
    const newHash = await bcrypt.hash(body.new_password, 10)
    await db.execute('UPDATE bmi_user SET password_hash = ? WHERE id = ?', [newHash, user.id])
    await db.execute('DELETE FROM bmi_admin_otp WHERE user_id = ?', [user.id])

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' })
  } catch (err) {
    next(err)
  }
})
