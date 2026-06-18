import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host: '122.184.128.90', port: 3306, user: 'root',
  password: 'vicidialnow', database: 'getjob', multipleStatements: true
})

try {
  // Fix recommendation enum values to match feedback endpoint
  await conn.query(`ALTER TABLE bmi_interview MODIFY COLUMN recommendation ENUM('strong_yes','yes','maybe','no','strong_no') NULL`)
  console.log('recommendation enum fixed')

  const [statusCol] = await conn.query(`SHOW COLUMNS FROM bmi_interview WHERE Field='status'`)
  console.log('interview.status:', statusCol[0].Type, '| Default:', statusCol[0].Default)

  const [recCol] = await conn.query(`SHOW COLUMNS FROM bmi_interview WHERE Field='recommendation'`)
  console.log('interview.recommendation:', recCol[0].Type)
} catch(e) { console.error('ERROR:', e.message) }

await conn.end()
