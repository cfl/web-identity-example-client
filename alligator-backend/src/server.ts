import express from 'express'
import type { Application } from 'express'
import { routes } from './routes.js'
import cors from 'cors'

const app: Application = express()

const port = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'production') {
  app.use(cors())
}
app.use('/api', routes)
app.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`)
})
