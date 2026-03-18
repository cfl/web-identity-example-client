import express from 'express'
import { userInfoEventWebhook } from './controllers/WebhookController.js'

const routes = express.Router()

// Webhook routes (no auth required for incoming webhooks)
routes.post('/webhook', (req, res) => userInfoEventWebhook.handleWebhook(req, res))

export { routes }
