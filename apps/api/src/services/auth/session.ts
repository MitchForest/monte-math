import { serialize } from 'cookie'

import { loadAuthEnvironment } from '../../config/auth'
import type { User } from '../../db/schema'
import {
  deleteSessionById,
  findSessionById,
  insertSession
} from './store'
import {
  generateSessionId,
  generateSessionToken,
  hashSessionToken
} from './tokens'

const env = loadAuthEnvironment()

const isProduction = process.env.NODE_ENV === 'production'

export interface SessionCookie {
  header: string
  sessionId: string
  sessionToken: string
  expiresAt: Date
}

export async function createSession(user: User): Promise<SessionCookie> {
  const sessionId = generateSessionId()
  const sessionToken = generateSessionToken()
  const hashedToken = hashSessionToken(sessionToken)
  const expiresAt = new Date(Date.now() + env.sessionMaxAgeSeconds * 1000)

  await insertSession({
    id: sessionId,
    user_id: user.id,
    hashed_session_token: hashedToken,
    expires_at: expiresAt.toISOString()
  })

  const header = serialize(env.sessionCookieName, `${sessionId}.${sessionToken}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: env.sessionMaxAgeSeconds
  })

  return {
    header,
    sessionId,
    sessionToken,
    expiresAt
  }
}

export async function invalidateSession(sessionId: string) {
  await deleteSessionById(sessionId)
}

export interface ParsedSessionToken {
  sessionId: string
  token: string
}

export function parseSessionCookie(raw: string | undefined): ParsedSessionToken | undefined {
  if (!raw) return undefined
  const [sessionId, token] = raw.split('.')
  if (!sessionId || !token) return undefined
  return { sessionId, token }
}

export async function getSessionFromCookie(raw: string | undefined) {
  const parsed = parseSessionCookie(raw)
  if (!parsed) return undefined

  const record = await findSessionById(parsed.sessionId)
  if (!record) return undefined

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await deleteSessionById(record.id)
    return undefined
  }

  const hashed = hashSessionToken(parsed.token)
  if (hashed !== record.hashed_session_token) {
    return undefined
  }

  return record
}

export function buildSessionClearHeader(): string {
  return serialize(env.sessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0
  })
}
