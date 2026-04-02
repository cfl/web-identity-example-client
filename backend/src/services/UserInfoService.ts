import dotenv from 'dotenv'
import axios from 'axios'
import type { CampaignType } from './CampaignType.js'

dotenv.config()

const SPORTZONE_CLIENT_ID = 'sportzone_forms'
export class UserInfoService {
  constructor() {}

  async generateAuthToken() {
    const response = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SPORTZONE_CLIENT_ID,
        client_secret: process.env.SPORTZONE_FORMS_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    const data = response.data
    return data.access_token
  }

  async saveToUserInfo(userId: string, campaignData: any) {
    const userDataToSubmit = <CampaignType>{
      userId,
      campaignId: 'Sample Campaign',
      data: campaignData,
    }

    const authToken = await this.generateAuthToken()
    const apiOptions = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
    await axios.post(`${process.env.USER_INFO_URL}/api/v1/campaigns`, userDataToSubmit, apiOptions)
  }
}
