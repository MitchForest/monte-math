import { ORPCError } from '@orpc/server'
import { buildDiceBearUrl } from '@monte/shared'

import type { User } from '../../db/schema'
import { updateUser, findUserById } from './store'
import { generateAvatarSeed } from './tokens'
import { verifyPassword, hashPassword } from './password'

export function toUserProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarSeed: user.avatar_seed,
    avatarUrl: buildDiceBearUrl({ seed: user.avatar_seed }),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export async function updateDisplayName(userId: string, displayName: string) {
  const user = await updateUser(userId, { display_name: displayName })
  return toUserProfile(user)
}

export async function regenerateAvatar(userId: string, seed?: string) {
  const avatarSeed = seed && seed.trim().length > 0 ? seed.trim() : generateAvatarSeed()
  const user = await updateUser(userId, { avatar_seed: avatarSeed })
  return toUserProfile(user)
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await findUserById(userId)
  if (!user || !user.password_hash) {
    throw new ORPCError('BAD_REQUEST', { message: 'Password authentication unavailable' })
  }

  const isValid = await verifyPassword(user.password_hash, currentPassword)
  if (!isValid) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Incorrect password' })
  }

  const hashed = await hashPassword(newPassword)
  await updateUser(userId, { password_hash: hashed })

  return { success: true as const }
}
