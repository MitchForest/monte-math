import { createHash } from 'crypto'
import { alphabet, generateRandomString } from 'oslo/crypto'

const ID_ALPHABET = alphabet('a-z', 'A-Z', '0-9')
const TOKEN_ALPHABET = alphabet('a-z', 'A-Z', '0-9', '-', '_')

function randomId(length: number): string {
  return generateRandomString(length, ID_ALPHABET)
}

function randomToken(length: number): string {
  return generateRandomString(length, TOKEN_ALPHABET)
}

export function generateUserId() {
  return `usr_${randomId(24)}`
}

export function generateSessionId() {
  return `ses_${randomId(24)}`
}

export function generateSessionToken() {
  return randomToken(48)
}

export function generateIdentityId() {
  return `idn_${randomId(24)}`
}

export function generateAvatarSeed() {
  return randomId(16)
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOAuthState() {
  return randomId(24)
}

export function generateCodeVerifier() {
  return randomToken(64)
}
