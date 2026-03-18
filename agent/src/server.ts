import 'dotenv/config'
import express from 'express'
import type { Application } from 'express'
import { routes } from './routes.js'
import cors from 'cors'
import { ngrokService } from './services/NgrokService.js'
import { userInfoEventWebhook } from './controllers/WebhookController.js'

const app: Application = express()

const port = process.env.PORT || 3002


// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: '*',
  optionsSuccessStatus: 200,
  preflightContinue: false
}))

app.use(express.json())

// Error handling for JSON parsing
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', err)
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  next(err)
})

app.use('/api', routes)

const agentUrl = process.env.AGENT_URL
const ngrokToken = process.env.NGROK_AUTH_TOKEN

if (!agentUrl && !ngrokToken) {
  console.log('Neither AGENT_URL nor NGROK_AUTH_TOKEN is set')
  console.log('Agent service is not needed - exiting')
  process.exit(0)
}

const server = app.listen(port, async () => {
  console.log(`Agent Server: http://localhost:${port}`)
  
  try {
    await userInfoEventWebhook.initialize(Number(port))
  } catch (error) {
    console.error('Failed to initialize webhook')
  }
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

process.on('SIGTERM', async () => {
  await userInfoEventWebhook.unregister()
  await ngrokService.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await userInfoEventWebhook.unregister()
  await ngrokService.stop()
  process.exit(0)
})
