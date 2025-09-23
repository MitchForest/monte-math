import type { Validator } from '@tanstack/form-core'
import type { ZodTypeAny, infer as ZodInfer } from 'zod'

const FALLBACK_MESSAGE = 'Invalid value'

export function zodValidator<TSchema extends ZodTypeAny>(schema: TSchema): Validator<ZodInfer<TSchema>> {
  return () => ({
    validate: ({ value }) => {
      const result = schema.safeParse(value)
      return result.success ? undefined : result.error.issues[0]?.message ?? FALLBACK_MESSAGE
    },
    validateAsync: async ({ value }) => {
      const result = await schema.safeParseAsync(value)
      return result.success ? undefined : result.error.issues[0]?.message ?? FALLBACK_MESSAGE
    }
  })
}
