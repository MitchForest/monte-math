function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface AuthEnvironment {
  sessionCookieName: string
  sessionMaxAgeSeconds: number
  jwtIssuer: string
  jwtSecret: string
  github?: OAuthProviderConfig
  google?: OAuthProviderConfig
}

export function loadAuthEnvironment(): AuthEnvironment {
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'monte_session'
  const sessionMaxAgeSeconds = Number(process.env.SESSION_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 7)
  const jwtIssuer = process.env.JWT_ISSUER ?? 'monte-api'
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret'

  const githubConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_REDIRECT_URI
  )
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  )

  return {
    sessionCookieName,
    sessionMaxAgeSeconds,
    jwtIssuer,
    jwtSecret,
    github: githubConfigured
      ? {
          clientId: requireEnv('GITHUB_CLIENT_ID'),
          clientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
          redirectUri: requireEnv('GITHUB_REDIRECT_URI'),
        }
      : undefined,
    google: googleConfigured
      ? {
          clientId: requireEnv('GOOGLE_CLIENT_ID'),
          clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
          redirectUri: requireEnv('GOOGLE_REDIRECT_URI'),
        }
      : undefined,
  }
}
