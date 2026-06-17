import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { db } from '../../db/mysql.js'
import { env } from '../../config/env.js'

export const authService = {
  async login(email: string, password: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.full_name, u.mobile, u.role, u.avatar_url,
              u.password_hash, u.is_blocked, u.must_change_password,
              t.id AS tenant_id, t.company_name AS tenant_name, t.plan, t.ai_credits
       FROM bmi_user u
       JOIN bmi_tenant t ON t.id = u.tenant_id
       WHERE u.email = ? AND u.is_blocked = 0`,
      [email]
    )
    const user = rows[0]
    if (!user) { const e: any = new Error('Invalid email or password'); e.status = 401; throw e }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) { const e: any = new Error('Invalid email or password'); e.status = 401; throw e }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, roles: [user.role], tenant_id: user.tenant_id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    const refreshToken = randomUUID()
    const refreshHash  = await bcrypt.hash(refreshToken, 10)
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.execute(
      `INSERT INTO bmi_refresh_token (id, user_id, tenant_id, token_hash, expires_at)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [user.id, user.tenant_id, refreshHash, expiresAt]
    )

    if (user.must_change_password) {
      await db.execute(`UPDATE bmi_user SET last_login_at = NOW() WHERE id = ?`, [user.id])
    } else {
      await db.execute(`UPDATE bmi_user SET last_login_at = NOW() WHERE id = ?`, [user.id])
    }

    return {
      access_token:  accessToken,
      refresh_token: refreshToken,
      user: {
        id:          user.id,
        email:       user.email,
        full_name:   user.full_name,
        role:        user.role,
        avatar_url:  user.avatar_url ?? null,
        tenant_id:   user.tenant_id,
        tenant_name: user.tenant_name,
        plan:        user.plan,
        ai_credits:  user.ai_credits,
      },
    }
  },

  async me(userId: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.full_name, u.role, u.avatar_url, u.tenant_id,
              t.company_name AS tenant_name, t.plan, t.ai_credits
       FROM bmi_user u
       JOIN bmi_tenant t ON t.id = u.tenant_id
       WHERE u.id = ?`,
      [userId]
    )
    return rows[0] ?? null
  },

  async logout(userId: string) {
    await db.execute(`UPDATE bmi_refresh_token SET revoked = 1 WHERE user_id = ?`, [userId])
  },
}
