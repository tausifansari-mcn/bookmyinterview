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
})

export async function testConnection(): Promise<void> {
  const conn = await db.getConnection()
  await conn.ping()
  conn.release()
  console.log(`[db] Connected to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`)
}
