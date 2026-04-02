import express from 'express'
import { sampleController } from './controllers/SampleController.js'
import { webhookController } from './controllers/WebhookController.js'
import { auth } from './middleware/Auth.js'
const routes = express.Router()

routes.get('/hello', auth.authenticate, sampleController.handleGet)
routes.get('/signUserToken', auth.authenticate, sampleController.signUserId)

routes.post('/webhook', webhookController.receiveWebhookData)

export { routes }
