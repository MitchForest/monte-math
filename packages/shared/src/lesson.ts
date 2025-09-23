import { z } from 'zod'

export const StepAction = z.union([
  z.object({ kind: z.literal('focus'), target: z.string(), zoom: z.number().optional() }),
  z.object({ kind: z.literal('highlight'), target: z.string(), style: z.enum(['ring', 'pulse']).optional() }),
  z.object({ kind: z.literal('spawn'), thing: z.enum(['unit', 'ten', 'hundred', 'thousand', 'card']), qty: z.number(), to: z.string() }),
  z.object({ kind: z.literal('move'), target: z.string(), to: z.string(), qty: z.number().optional() }),
  z.object({ kind: z.literal('exchange'), column: z.enum(['units', 'tens', 'hundreds', 'thousands']) }),
  z.object({ kind: z.literal('prompt'), text: z.string(), token: z.string().optional() }),
  z.object({ kind: z.literal('gate-do'), expect: z.string(), hint: z.string().optional() }),
  z.object({ kind: z.literal('wait'), ms: z.number() })
])

export const Step = z.object({
  id: z.string(),
  label: z.string().optional(),
  actions: z.array(StepAction)
})

export const Stage = z.object({
  id: z.string(),
  mode: z.enum(['tutorial', 'worked', 'practice']),
  heading: z.string().optional(),
  materialSlug: z.string(),
  materialConfig: z.record(z.any()).optional(),
  steps: z.array(Step).optional(),
  practiceTemplateId: z.string().optional()
})

export const PracticeTemplate = z.object({
  id: z.string(),
  prompt: z.string(),
  inputs: z.record(z.any()),
  answer: z.any(),
  meta: z.record(z.any()).optional()
})

export const LessonScript = z.object({
  lessonId: z.string(),
  version: z.string(),
  stages: z.array(Stage),
  practiceTemplates: z.array(PracticeTemplate).optional()
})

export type StepAction = z.infer<typeof StepAction>
export type Step = z.infer<typeof Step>
export type Stage = z.infer<typeof Stage>
export type PracticeTemplate = z.infer<typeof PracticeTemplate>
export type LessonScript = z.infer<typeof LessonScript>