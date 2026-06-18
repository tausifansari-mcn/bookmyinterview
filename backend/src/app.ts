import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { jobsRouter } from './modules/jobs/jobs.routes.js'
import { candidatesRouter } from './modules/candidates/candidates.routes.js'
import { portalRouter } from './modules/portal/portal.routes.js'
import { questionsRouter } from './modules/questions/questions.routes.js'
import { uploadRouter } from './modules/upload/upload.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js'
import { assessmentsRouter } from './modules/assessments/assessments.routes.js'
import { applicationsRouter } from './modules/applications/applications.routes.js'
import { interviewsRouter } from './modules/interviews/interviews.routes.js'
import { offersRouter }    from './modules/offers/offers.routes.js'
import { analyticsRouter } from './modules/analytics/analytics.routes.js'

export const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === env.FRONTEND_URL || (env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'))) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }))
app.use('/api/v1/auth/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Health
app.get('/api/health', (_req, res) => res.json({
  success: true, service: 'Book My Interview API', version: '1.0.0', ts: new Date().toISOString()
}))

// API v1 Routes
const v1 = express.Router()
v1.use('/auth',       authRouter)
v1.use('/jobs',       jobsRouter)
v1.use('/candidates', candidatesRouter)
v1.use('/portal',     portalRouter)
v1.use('/questions',  questionsRouter)
v1.use('/upload',     uploadRouter)
v1.use('/users',        usersRouter)
  v1.use('/dashboard',    dashboardRouter)
  v1.use('/assessments',  assessmentsRouter)
  v1.use('/applications', applicationsRouter)
  v1.use('/interviews',   interviewsRouter)
  v1.use('/offers',       offersRouter)
  v1.use('/analytics',    analyticsRouter)
app.use('/api/v1', v1)

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }))

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors })
  const status = err.status ?? err.statusCode ?? 500
  const message = err.message ?? 'Internal server error'
  if (env.NODE_ENV !== 'production') console.error(err)
  res.status(status).json({ success: false, message })
})
