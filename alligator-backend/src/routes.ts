import express from 'express'
import { sampleController } from './controllers/SampleController.js'
import { auth } from './middleware/Auth.js'
const routes = express.Router()

routes.get('/hello', auth.authenticate, sampleController.handleGet)

export { routes }
