import type { LessonScript } from '@monte/shared'

export async function smokeTest(script: LessonScript): Promise<void> {
  // TODO: Implement headless Pixi runner to validate script
  // For now, just check basic structure
  if (!script.stages || script.stages.length === 0) {
    throw new Error('Script has no stages')
  }
  
  console.log(`Smoke test passed for ${script.lessonId}@${script.version}`)
}