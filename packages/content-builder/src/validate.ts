import { LessonScript } from '@monte/shared'
import { z } from 'zod'

export function validate(script: unknown): LessonScript {
  try {
    return LessonScript.parse(script)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${JSON.stringify(error.errors, null, 2)}`)
    }
    throw error
  }
}