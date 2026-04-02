export interface CampaignType {
  userId: string // required
  campaignId: string // required
  submittedDate?: string // optional
  campaignName?: string // optional
  partnerId?: string // optional
  clubId?: string // optional
  data: { [key: string]: any } // required and must be a non-empty object
}
