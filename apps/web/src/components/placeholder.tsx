// Placeholder component for LessonPlayer
// Will be implemented with actual Pixi integration later

import type { LessonScript } from '@monte/shared'

export interface LessonPlayerProps {
  script: LessonScript
}

export function LessonPlayer({ script }: LessonPlayerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-4">Lesson Player</h2>
      <p className="text-gray-600">Loading: {script.lessonId} v{script.version}</p>
      <p className="text-sm text-gray-500 mt-2">
        {script.stages.length} stages ready
      </p>
    </div>
  )
}