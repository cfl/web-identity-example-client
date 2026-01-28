import type { Request, Response } from 'express'

export class SampleController {
  handleGet(req: Request, res: Response) {
    const extractUserInfo = res.locals.user
    res.send({ user: extractUserInfo })
  }
}

const sampleController = new SampleController()

export { sampleController }
