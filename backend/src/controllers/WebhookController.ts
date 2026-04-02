import type { Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { UserInfoService } from '../services/UserInfoService.js'

const SAMPLE_SECRET = 'SECRET_FOR_FORMS_REPLACE_IN_REAL_APP'

export class WebhookController {
  private userInfoService: UserInfoService

  constructor() {
    this.userInfoService = new UserInfoService()
  }

  receiveWebhookData = async (req: Request, res: Response) => {
    if (!req.body || !req.body.data) {
      throw new Error('Request is missing required information')
    }
    let formData = req.body.data
    if (!formData.userToken) {
      throw new Error('Submission is missing the required userToken')
    }
    const decodedUserToken = decodeURI(formData.userToken)

    const tokenData = jwt.verify(decodedUserToken, SAMPLE_SECRET) as JwtPayload
    if (!tokenData || !tokenData.userId) {
      throw new Error('Invalid user id, cannot save data')
    }
    delete formData.userToken
    await this.userInfoService.saveToUserInfo(tokenData.userId, formData)
  }
}

const webhookController = new WebhookController()

export { webhookController }
