import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  PORT:         z.coerce.number().default(5055),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DB_HOST:     z.string().default('122.184.128.90'),
  DB_PORT:     z.coerce.number().default(3306),
  DB_USER:     z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME:     z.string().default('suggest'),
  DB_POOL_MAX: z.coerce.number().default(20),

  JWT_SECRET:          z.string().min(32).default('change-me-bmi-jwt-secret-32characters!!'),
  JWT_REFRESH_SECRET:  z.string().min(32).default('change-me-bmi-refresh-secret-32chars!'),
  JWT_EXPIRES_IN:      z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  SMTP_HOST:      z.string().default('smtp.gmail.com'),
  SMTP_PORT:      z.coerce.number().default(587),
  SMTP_USER:      z.string().default(''),
  SMTP_PASS:      z.string().default(''),
  SMTP_FROM:      z.string().default('noreply@bookmyinterview.in'),
  SMTP_FROM_NAME: z.string().default('Book My Interview'),

  RAZORPAY_KEY_ID:     z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (parsed.data.NODE_ENV === 'production') {
  const insecure = ['change-me-bmi-jwt-secret-32characters!!', 'change-me-bmi-refresh-secret-32chars!']
  if (insecure.includes(parsed.data.JWT_SECRET))  { console.error('[FATAL] JWT_SECRET must be changed'); process.exit(1) }
  if (insecure.includes(parsed.data.JWT_REFRESH_SECRET)) { console.error('[FATAL] JWT_REFRESH_SECRET must be changed'); process.exit(1) }
}

export const env = parsed.data
