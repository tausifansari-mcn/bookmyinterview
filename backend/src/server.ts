import { app } from './app.js'
import { env } from './config/env.js'
import { testConnection } from './db/mysql.js'

async function startServer() {
  await testConnection()
  app.listen(env.PORT, () => {
    console.log(`\n🚀 Book My Interview API running on http://localhost:${env.PORT}`)
    console.log(`   Environment : ${env.NODE_ENV}`)
    console.log(`   Database    : ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`)
    console.log(`   Frontend    : ${env.FRONTEND_URL}\n`)
  })
}

startServer().catch(err => {
  console.error('[startup] Failed to start server:', err.message)
  process.exit(1)
})
