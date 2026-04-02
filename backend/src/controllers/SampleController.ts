import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const SAMPLE_SECRET = 'SECRET_FOR_FORMS_REPLACE_IN_REAL_APP'

export class SampleController {
  handleGet(req: Request, res: Response) {
    const extractUserInfo = res.locals.user
    res.send({ user: extractUserInfo })
  }

  signUserId(req: Request, res: Response) {
    const userId = res.locals.user.sub
    const signedUserId = jwt.sign({ userId }, SAMPLE_SECRET, { expiresIn: '1h' })
    console.log('User Id ', userId)
    console.log('Signed User Id ', signedUserId)
    res.send({ userIdToken: signedUserId })
  }
}

const sampleController = new SampleController()

export { sampleController }
