import { z } from 'zod'

import type { StepAction } from './lesson'
import type { SemanticEvent } from './events'

export interface MaterialScene {
  mount(canvas: unknown, cfg?: Record<string, unknown>): void
  apply(action: StepAction): Promise<void>
  lock(interactive: boolean): void
  onSemantic(cb: (event: SemanticEvent) => void): () => void
  generate(templateId: string, seed: number): unknown
  validate(input: unknown, reading: unknown): { correct: boolean }
  unmount(): void
}

export const nextTaskSchema = z.object({
  kind: z.enum(['lesson', 'checkpoint', 'review']),
  lessonId: z.string().optional(),
  checkpointId: z.string().optional(),
  version: z.string(),
  estimatedXP: z.number()
})

export type NextTask = z.infer<typeof nextTaskSchema>

export const attemptSchema = z.object({
  userId: z.string(),
  skillId: z.string(),
  lessonId: z.string(),
  version: z.string(),
  correct: z.boolean(),
  latencyMs: z.number()
})

export type AttemptPayload = z.infer<typeof attemptSchema>

export const xpProgressSchema = z.object({
  todayXP: z.number(),
  goal: z.number(),
  streak: z.number()
})

export type XPProgress = z.infer<typeof xpProgressSchema>
