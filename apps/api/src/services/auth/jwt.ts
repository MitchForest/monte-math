import { SignJWT } from 'jose'

import { loadAuthEnvironment } from '../../config/auth'

const env = loadAuthEnvironment()
const secretKey = new TextEncoder().encode(env.jwtSecret)

export interface JwtIssueOptions {
  userId: string
  sessionId: string
  audience: string[]
  expiresInSeconds: number
}

export async function issueJwt({
  userId,
  sessionId,
  audience,
  expiresInSeconds
}: JwtIssueOptions) {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  let jwt = new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(env.jwtIssuer)
    .setSubject(userId)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()

  if (audience.length > 0) {
    jwt = jwt.setAudience(audience)
  }

  const token = await jwt.sign(secretKey)

  return {
    token,
    expiresAt
  }
}
