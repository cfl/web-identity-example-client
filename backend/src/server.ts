import dotenv from 'dotenv'
import express from 'express'
import type { Application } from 'express'
import { routes } from './routes.js'
import cors from 'cors'

dotenv.config()

const app: Application = express()

const port = process.env.PORT || 3001

// Middleware
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:49613'

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  }),
)

app.use(express.json())
app.use('/api', routes)

const server = app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`)
})

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`✗ ERROR: Port ${port} is already in use!`)
    console.error(`✗ Another application is using this port`)
    console.error(`✗ Please stop the other application or change the PORT environment variable`)
  } else {
    console.error('✗ Server error:', error)
  }
  process.exit(1)
})

process.on('SIGTERM', () => {
  process.exit(0)
})

process.on('SIGINT', () => {
  process.exit(0)
})
