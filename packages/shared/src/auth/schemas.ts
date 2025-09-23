import { z } from 'zod'

export const authProviderSchema = z.enum(['github', 'google'])

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  avatarSeed: z.string(),
  avatarUrl: z.string().url(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export const sessionSchema = z.object({
  id: z.string(),
  expiresAt: z.string().datetime({ offset: true }),
})

export const authResultSchema = z.object({
  user: userProfileSchema,
  session: sessionSchema,
})

export const registrationInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120).optional(),
})

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const beginOAuthInputSchema = z.object({
  provider: authProviderSchema,
  redirectUri: z.string().url(),
  state: z.string().optional(),
})

export const beginOAuthOutputSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
  codeVerifier: z.string().optional(),
})

export const completeOAuthInputSchema = z.object({
  provider: authProviderSchema,
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url(),
  codeVerifier: z.string().optional(),
})

export const jwtIssueInputSchema = z.object({
  audience: z.array(z.string()).default([]),
  expiresInSeconds: z
    .number()
    .int()
    .min(60)
    .max(60 * 60),
})

export const jwtIssueOutputSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime({ offset: true }),
})

export type AuthProvider = z.infer<typeof authProviderSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type SessionInfo = z.infer<typeof sessionSchema>

export const profileUpdateInputSchema = z.object({
  displayName: z.string().min(1).max(120),
})

export const avatarRegenerateInputSchema = z
  .object({
    seed: z.string().min(1).max(120).optional(),
  })
  .default({})

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
})
