import { createHash } from 'crypto'
import { generateIdFromEntropySize } from 'oslo/crypto'

export function generateUserId() {
  return `usr_${generateIdFromEntropySize(16)}`
}

export function generateSessionId() {
  return `ses_${generateIdFromEntropySize(16)}`
}

export function generateSessionToken() {
  return generateIdFromEntropySize(32)
}

export function generateIdentityId() {
  return `idn_${generateIdFromEntropySize(16)}`
}

export function generateAvatarSeed() {
  return generateIdFromEntropySize(12)
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOAuthState() {
  return generateIdFromEntropySize(16)
}

export function generateCodeVerifier() {
  return generateIdFromEntropySize(32)
}
