import type { LessonScript } from '@monte/shared'

export async function compile(
  script: LessonScript,
  _params?: Record<string, any>
): Promise<LessonScript> {
  // TODO: Implement template expansion and macro processing
  // For now, return as-is
  return script
}
