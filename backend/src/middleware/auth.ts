import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; tenant_id: string; roles: string[] }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as any
    req.user = {
      id:        payload.sub,
      email:     payload.email,
      role:      payload.role,
      tenant_id: payload.tenant_id,
      roles:     payload.roles ?? [payload.role],
    }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function requireRole(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.user?.roles ?? []
    if (roles.includes('super_admin') || allowed.some(r => roles.includes(r))) return next()
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
}

export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.tenant_id) return res.status(403).json({ success: false, message: 'No tenant context' })
  next()
}
