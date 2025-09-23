import { GitHub, Google } from 'arctic'

import { loadAuthEnvironment } from '../../config/auth'

const env = loadAuthEnvironment()

export type SupportedProvider = 'github' | 'google'

export interface OAuthAuthorizationRequest {
  authorizationUrl: string
  state: string
  codeVerifier?: string
}

export function createProvider(provider: SupportedProvider) {
  if (provider === 'github') {
    if (!env.github) {
      throw new Error('GitHub OAuth is not configured')
    }

    return new GitHub(env.github.clientId, env.github.clientSecret)
  }

  if (provider === 'google') {
    if (!env.google) {
      throw new Error('Google OAuth is not configured')
    }

    return new Google(env.google.clientId, env.google.clientSecret)
  }

  throw new Error(`Unsupported provider: ${provider}`)
}

export function getRedirectUri(provider: SupportedProvider) {
  if (provider === 'github') {
    if (!env.github) throw new Error('GitHub OAuth is not configured')
    return env.github.redirectUri
  }

  if (provider === 'google') {
    if (!env.google) throw new Error('Google OAuth is not configured')
    return env.google.redirectUri
  }

  throw new Error(`Unsupported provider: ${provider}`)
}
