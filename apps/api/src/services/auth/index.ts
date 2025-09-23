import { ORPCError } from '@orpc/server'
import type { AuthProvider } from '@monte/shared'

import { toUserProfile } from './profile'
import { hashPassword, verifyPassword } from './password'
import { issueJwt } from './jwt'
import {
  buildSessionClearHeader,
  createSession,
  getSessionFromCookie,
  invalidateSession
} from './session'
import {
  findIdentity,
  findUserByEmail,
  findUserById,
  insertUser,
  upsertIdentity
} from './store'
import {
  generateAvatarSeed,
  generateCodeVerifier,
  generateIdentityId,
  generateOAuthState,
  generateUserId
} from './tokens'
import { createProvider, getRedirectUri } from './providers'
import type { User } from '../../db/schema'

interface CredentialsInput {
  email: string
  password: string
  displayName?: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function ensureUserById(id: string): Promise<User> {
  const user = await findUserById(id)
  if (!user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'User not found' })
  }
  return user
}

export async function registerWithPassword(input: CredentialsInput) {
  const email = normalizeEmail(input.email)
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new ORPCError('BAD_REQUEST', { message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(input.password)

  const user = await insertUser({
    id: generateUserId(),
    email,
    email_verified_at: null,
    password_hash: passwordHash,
    display_name: input.displayName ?? null,
    avatar_seed: generateAvatarSeed()
  })

  const session = await createSession(user)

  return {
    user: toUserProfile(user),
    session: {
      id: session.sessionId,
      expiresAt: session.expiresAt.toISOString()
    },
    cookie: session.header
  }
}

export async function loginWithPassword(input: CredentialsInput) {
  const email = normalizeEmail(input.email)
  const user = await findUserByEmail(email)
  if (!user || !user.password_hash) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Invalid credentials' })
  }

  const isValid = await verifyPassword(user.password_hash, input.password)
  if (!isValid) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Invalid credentials' })
  }

  const session = await createSession(user)

  return {
    user: toUserProfile(user),
    session: {
      id: session.sessionId,
      expiresAt: session.expiresAt.toISOString()
    },
    cookie: session.header
  }
}

export async function getSessionFromRequest(cookie: string | undefined) {
  const session = await getSessionFromCookie(cookie)
  if (!session) return undefined
  const user = await ensureUserById(session.user_id)
  return { session, user }
}

export async function logout(sessionId: string) {
  await invalidateSession(sessionId)
  return buildSessionClearHeader()
}

export async function issueJwtForSession(opts: {
  userId: string
  sessionId: string
  audience: string[]
  expiresInSeconds: number
}) {
  return issueJwt(opts)
}

export async function beginOAuthFlow(provider: AuthProvider) {
  const oauthProvider = createProvider(provider)
  const redirectUri = getRedirectUri(provider)

  const state = generateOAuthState()
  const codeVerifier = generateCodeVerifier()

  const result = await oauthProvider.createAuthorizationURL(redirectUri, {
    state,
    scopes: provider === 'github' ? ['user:email'] : ['openid', 'email', 'profile'],
    codeVerifier
  })

  return {
    authorizationUrl: result instanceof URL ? result.href : String(result),
    state,
    codeVerifier
  }
}

export async function completeOAuthFlow(provider: AuthProvider, params: {
  code: string
  state: string
  redirectUri: string
  codeVerifier?: string
}) {
  if (!params.state) {
    throw new ORPCError('BAD_REQUEST', { message: 'Missing OAuth state' })
  }

  const oauthProvider = createProvider(provider)

  const tokens = await oauthProvider.validateAuthorizationCode(params.code, params.redirectUri, {
    codeVerifier: params.codeVerifier
  })

  const identityData = await fetchProviderIdentity(provider, tokens.accessToken)

  const existingIdentity = await findIdentity(provider, identityData.providerUserId)
  if (existingIdentity) {
    const user = await ensureUserById(existingIdentity.user_id)
    const session = await createSession(user)

    return {
      user: toUserProfile(user),
      session: {
        id: session.sessionId,
        expiresAt: session.expiresAt.toISOString()
      },
      cookie: session.header
    }
  }

  let user = identityData.email ? await findUserByEmail(identityData.email) : undefined

  if (!user) {
    user = await insertUser({
      id: generateUserId(),
      email: identityData.email ?? null,
      email_verified_at: identityData.email ? new Date().toISOString() : null,
      password_hash: null,
      display_name: identityData.displayName ?? null,
      avatar_seed: generateAvatarSeed()
    })
  }

  await upsertIdentity({
    id: generateIdentityId(),
    user_id: user.id,
    provider,
    provider_user_id: identityData.providerUserId,
    email: identityData.email ?? null
  })

  const session = await createSession(user)

  return {
    user: toUserProfile(user),
    session: {
      id: session.sessionId,
      expiresAt: session.expiresAt.toISOString()
    },
    cookie: session.header
  }
}

interface ProviderIdentityResult {
  providerUserId: string
  email?: string
  displayName?: string
}

async function fetchProviderIdentity(provider: AuthProvider, accessToken: string): Promise<ProviderIdentityResult> {
  if (provider === 'github') {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to fetch GitHub profile'
      })
    }

    const profile = (await response.json()) as { id: number; email: string | null; name: string | null }

    let email = profile.email ?? undefined
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      })

      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>
        const primary = emails.find((item) => item.primary && item.verified)
        email = primary?.email
      }
    }

    return {
      providerUserId: String(profile.id),
      email,
      displayName: profile.name ?? undefined
    }
  }

  if (provider === 'google') {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to fetch Google profile'
      })
    }

    const profile = (await response.json()) as { sub: string; email?: string; name?: string }

    return {
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name
    }
  }

  throw new ORPCError('BAD_REQUEST', { message: 'Unsupported provider' })
}

export function buildClearSessionHeader() {
  return buildSessionClearHeader()
}
