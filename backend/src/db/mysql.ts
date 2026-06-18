import mysql from 'mysql2/promise'
import { env } from '../config/env.js'

export const db = mysql.createPool({
  host:               env.DB_HOST,
  port:               env.DB_PORT,
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  connectionLimit:    env.DB_POOL_MAX,
  charset:            'utf8mb4',
  timezone:           '+05:30',
  waitForConnections: true,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  decimalNumbers:     true,
})

// Force every pooled connection to use utf8mb4_unicode_ci so string
// parameters match the collation all bmi_ tables were created with.
db.on('connection', (conn: any) => {
  conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'")
})

export async function testConnection(): Promise<void> {
  const conn = await db.getConnection()
  await conn.ping()
  conn.release()
  console.log(`[db] Connected to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`)
}
