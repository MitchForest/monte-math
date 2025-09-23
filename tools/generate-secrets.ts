#!/usr/bin/env bun
/**
 * Generate secure secrets for JWT and session tokens
 * Run with: bun run tools/generate-secrets.ts
 */

import { randomBytes } from 'crypto'

function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('base64url')
}

function generateHexSecret(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

console.log('🔐 Monte Math Auth Secret Generator\n')
console.log('Copy these values to your .env file:\n')
console.log('----------------------------------------')

// Generate JWT Secret (256-bit / 32 bytes minimum recommended)
const jwtSecret = generateSecret(32)
console.log(`JWT_SECRET=${jwtSecret}`)

// Generate Session Secret (256-bit / 32 bytes minimum)  
const sessionSecret = generateSecret(32)
console.log(`SESSION_SECRET=${sessionSecret}`)

console.log('----------------------------------------\n')

console.log('📝 Additional Information:\n')
console.log('• JWT_SECRET: Used to sign JWT tokens for API authentication')
console.log('• SESSION_SECRET: Used to sign session cookies')
console.log('• Both secrets should be at least 32 characters (256 bits)')
console.log('• Keep these secret and never commit them to version control!')
console.log('• Regenerate these for each environment (dev, staging, prod)')

console.log('\n🎲 Alternative generation methods:')
console.log('----------------------------------------')
console.log('Using OpenSSL:')
console.log('  openssl rand -base64 32')
console.log('\nUsing Node.js:')
console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"')
console.log('\nUsing Web Crypto API (in browser console):')
console.log('  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))')