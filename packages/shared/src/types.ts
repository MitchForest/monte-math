export interface MaterialScene {
  mount(canvas: any, cfg?: Record<string, unknown>): void
  apply(action: StepAction): Promise<void>
  lock(interactive: boolean): void
  onSemantic(cb: (e: SemanticEvent) => void): () => void
  generate(templateId: string, seed: number): any
  validate(input: any, reading: any): { correct: boolean }
  unmount(): void
}

export interface NextTaskResponse {
  kind: 'lesson' | 'checkpoint' | 'review'
  lessonId?: string
  checkpointId?: string
  version: string
  estimatedXP: number
}

export interface AttemptRequest {
  userId: string
  skillId: string
  lessonId: string
  version: string
  correct: boolean
  latencyMs: number
}

export interface XPResponse {
  todayXP: number
  goal: number
  streak: number
}

import type { StepAction } from './lesson'
import type { SemanticEvent } from './events'