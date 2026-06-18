import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'

const conn = await mysql.createConnection({
  host: '122.184.128.90', port: 3306, user: 'root',
  password: 'vicidialnow', database: 'getjob', multipleStatements: true
})

const sql = readFileSync('./database/10_assessment_evaluation.sql', 'utf8')
try {
  await conn.query(sql)
  console.log('Migration 10 applied successfully')
  const [tables] = await conn.query('SHOW TABLES')
  console.log('Total tables:', tables.length)
  const newTables = tables.filter(t => {
    const name = Object.values(t)[0]
    return name.includes('assessment') || name.includes('evaluation') || name.includes('interview') || name.includes('offer')
  })
  console.log('Assessment/Eval/Interview tables:', newTables.map(t => Object.values(t)[0]))
} catch(e) { console.error('Migration error:', e.message) }
await conn.end()
