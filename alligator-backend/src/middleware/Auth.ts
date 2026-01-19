import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import dotenv from 'dotenv'
dotenv.config()

// this needs to be filled out for all the attributes necessary
export interface UserInfo extends JwtPayload {
  resource_access: {
    [key: string]: {
      roles: string[]
    }
  }
}

export class Auth {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'Missing authorization header' })
    }
    const tokens = authHeader.split(' ')
    if (tokens.length < 2) {
      return res
        .status(401)
        .json({ message: 'Authorization header not formatted correctly' })
    }

    const token = tokens[1]
    const decoded = jwt.decode(token, { complete: true })

    if (!decoded || !decoded.header || !decoded.header.kid) {
      return res.status(401).json({ message: 'Missing kid in JWT header' })
    }

    const kid = decoded.header.kid

    const KEYCLOAK_URL = process.env.KEYCLOAK_URL
    const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM
    if (!KEYCLOAK_URL && !KEYCLOAK_REALM) {
      return res.status(401).json({ message: 'Keycloak parameters incomplete' })
    }
    const KEYCLOAK_PUBLIC_KEY_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`
    const jwksClient = jwksRsa({
      jwksUri: KEYCLOAK_PUBLIC_KEY_URL,
      cache: true, // enable caching
      cacheMaxEntries: 5, // max number of cached keys
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10
    })
    const publicKey = await jwksClient.getSigningKey(kid)
    if (!publicKey) {
      throw new Error('No public cert found')
    }
    try {
      const userInfo = jwt.verify(token, publicKey.getPublicKey()) as UserInfo
      res.locals.user = userInfo
      next()
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }
}

const auth = new Auth()
export { auth }
