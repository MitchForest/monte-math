import { lessonScriptSchema, type LessonScript } from '@monte/shared'
import { z } from 'zod'

export function validate(script: unknown): LessonScript {
  try {
    return lessonScriptSchema.parse(script)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${JSON.stringify(error.issues, null, 2)}`)
    }
    throw error
  }
}
