import ngrok from '@ngrok/ngrok'

//This class is only used in development to create a public URL for receiving webhooks from external services. 
//On the cloud, you would typically use a proper hosting solution with a fixed URL.
export class NgrokService {
  private listener: any = null
  private ngrokUrl: string = ''

  /**
   * Start ngrok tunnel
   * @param port - The local port to expose (default: 3002)
   */
  async start(port: number = 3002): Promise<string> {
    try {
      const config: any = { addr: port }
      
      const authToken = process.env.NGROK_AUTH_TOKEN
      if (authToken) {
        config.authtoken = authToken
      }

      this.listener = await ngrok.connect(config)
      this.ngrokUrl = this.listener.url()

      console.log(`Ngrok: ${this.ngrokUrl}`)
      return this.ngrokUrl
    } catch (error) {
      console.error('Failed to start ngrok:', error)
      throw error
    }
  }

  /**
   * Get the current ngrok public URL
   */
  getUrl(): string {
    return this.ngrokUrl
  }

  /**
   * Stop the ngrok tunnel
   */
  async stop(): Promise<void> {
    if (this.listener) {
      console.log('Stopping ngrok tunnel...')
      await this.listener.close()
      this.listener = null
      this.ngrokUrl = ''
      console.log('✓ Ngrok tunnel stopped')
    }
  }

  /**
   * Check if ngrok is currently running
   */
  isRunning(): boolean {
    return this.listener !== null
  }
}

// Export singleton instance
export const ngrokService = new NgrokService()
