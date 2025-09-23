import { buildDiceBearUrl } from '@monte/shared'

import type { User } from '../../db/schema'

export function toUserProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarSeed: user.avatar_seed,
    avatarUrl: buildDiceBearUrl({ seed: user.avatar_seed }),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}
