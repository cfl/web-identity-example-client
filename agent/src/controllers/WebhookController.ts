import type { Request, Response } from 'express'
import { ngrokService } from '../services/NgrokService.js'
import crypto from 'crypto'

export class UserInfoEventWebhookController {
  private agentUrl: string = ''
  private hmacSecret: string = ''
  private port: number = 3002
  private retryInterval: number = 5 * 60 * 1000 // 5 minutes
  private retryTimer: NodeJS.Timeout | null = null
  private isRegistered: boolean = false // Track if webhook is registered

  /**
   * Initialize the webhook by setting up the backend URL and registering with Keycloak
   */
  async initialize(port: number): Promise<void> {
    this.port = port
    this.clearRetry()
    
    try {
      // Step 1: Setup backend URL (either env var or ngrok)
      this.agentUrl = process.env.AGENT_URL || ''
      
      if (this.agentUrl) {
        console.log(`Agent URL: ${this.agentUrl}`)
      } else {
        // For local development only - use ngrok to expose local agent
        // For cloud deployment, set AGENT_URL environment variable instead
        this.agentUrl = await ngrokService.start(port)
      }
      
      const webhookUrl = `${this.agentUrl}/api/webhook`
      console.log(`Webhook: ${webhookUrl}`)
      
      // Step 2: Generate HMAC secret if not already set
      if (!this.hmacSecret) {
        this.hmacSecret = crypto.randomBytes(32).toString('hex')
      }
      
      // Step 3: Get admin token and register webhook with Keycloak
      const keycloakUrl = process.env.KEYCLOAK_URL
      const realm = process.env.KEYCLOAK_REALM
      const agentClientId = process.env.KEYCLOAK_AGENT_CLIENT_ID
      const agentClientSecret = process.env.KEYCLOAK_AGENT_CLIENT_SECRET
      const clientId = process.env.KEYCLOAK_CLIENT_ID
      
      if (!keycloakUrl || !realm) {
        throw new Error('Missing required environment variables: KEYCLOAK_URL, KEYCLOAK_REALM')
      }
      
      if (!agentClientId || !agentClientSecret) {
        throw new Error('Missing agent client credentials: KEYCLOAK_AGENT_CLIENT_ID, KEYCLOAK_AGENT_CLIENT_SECRET')
      }
      
      if (!clientId) {
        throw new Error('Missing client ID: KEYCLOAK_CLIENT_ID (the client whose events you want to monitor)')
      }
      
      // Get admin token using client credentials
      const tokenResponse = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: agentClientId,
          client_secret: agentClientSecret,
          grant_type: 'client_credentials'
        })
      })
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get admin token: ${tokenResponse.status}`)
      }
      
      const tokenData = await tokenResponse.json()
      const adminToken = tokenData.access_token
      
      // Register webhook with Keycloak for the specified client
      const endpoint = `${keycloakUrl}/realms/${realm}/event-listeners`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          clientId: clientId,
          webhookUrl: webhookUrl,
          hmac: this.hmacSecret,
        }),
      })
      
      if (response.ok) {
        console.log('Webhook registered successfully with Keycloak')
        this.isRegistered = true
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to register webhook: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Webhook initialization failed:', error)
      this.scheduleRetry()
    }
  }

  /**
   * Schedule a retry of full initialization
   */
  private scheduleRetry(): void {
    if (this.retryTimer) {
      return
    }
    
    console.log(`Will retry webhook initialization in ${this.retryInterval / 1000 / 60} minutes`)
    
    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null
      await this.initialize(this.port)
    }, this.retryInterval)
  }

  /**
   * Clear the retry timer
   */
  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  /**
   * Unregister the webhook from Keycloak
   */
  async unregister(): Promise<void> {
    // Stop any pending retry attempts
    this.clearRetry()
    
    // Only unregister if webhook was successfully registered
    if (!this.isRegistered) {
      return
    }
    
    const keycloakUrl = process.env.KEYCLOAK_URL
    const realm = process.env.KEYCLOAK_REALM
    const clientId = process.env.KEYCLOAK_CLIENT_ID
    
    if (!keycloakUrl || !realm || !clientId) {
      return
    }
    
    try {
      const endpoint = `${keycloakUrl}/realms/${realm}/event-listeners/${clientId}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        console.log('Webhook unregistered from Keycloak')
        this.isRegistered = false
      } else {
        console.error(`Failed to unregister webhook: ${response.status}`)
      }
    } catch (error) {
      console.error('Error unregistering webhook:', error)
    }
  }

  /**
   * Get the agent URL
   */
  getAgentUrl(): string {
    return this.agentUrl
  }

  /**
   * Verify HMAC signature of webhook payload
   */
  private verifySignature(body: any, signature: string): boolean {
    const payload = JSON.stringify(body)
    const expectedSignature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Handle incoming user info event webhook
   * This endpoint receives notifications about user events from external services
   */
  handleWebhook(req: Request, res: Response) {
      console.log('User Info Event Webhook Received')

    // Check for signature in body or header
    const signature = req.body.signature || req.headers['x-keycloak-signature'] as string
    const bodyWithoutSignature = { ...req.body }
    delete bodyWithoutSignature.signature

    // Verify HMAC signature if provided
    if (signature) {
      if (!this.verifySignature(bodyWithoutSignature, signature)) {
        console.error('Webhook: Invalid signature')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }

    // Process the webhook payload
    const eventData = req.body
    const eventType = eventData.type

    // Log based on event type
    if (eventType === 'user.deleted' || eventType === 'DELETE_ACCOUNT') {
      const username = eventData.username || eventData.userId || eventData.details?.username
      if (username) {
        console.log(`User deleted: ${username}`)
      } else {
        console.log(`User deletion event received (no username found)`)
      }
    } else {
      console.log(`Webhook event: ${eventType || 'unknown'}`)
    }

    // Respond to webhook sender
    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString(),
    })
  }
}

const userInfoEventWebhook = new UserInfoEventWebhookController()

export { userInfoEventWebhook }
