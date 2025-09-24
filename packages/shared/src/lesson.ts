import { z } from 'zod'

const goldenBeadsConfigSchema = z.object({
  addends: z.tuple([z.number().int(), z.number().int()]),
  startEmpty: z.boolean().optional(),
  prepopulateAddends: z.boolean().optional(),
})

const stampGameConfigSchema = z.object({
  multiplicand: z.number().int(),
  multiplier: z.number().int(),
  startEmpty: z.boolean().optional(),
  prepopulateMultiplicand: z.boolean().optional(),
  prepopulateCopies: z.boolean().optional(),
})

const practiceProblemSchema = z.object({
  a: z.number().int(),
  b: z.number().int(),
  focus: z.string(),
})

const practiceMetaSchema = z.object({
  skillIds: z.array(z.string()),
})

export const stepActionSchema = z.union([
  z.object({ kind: z.literal('focus'), target: z.string(), zoom: z.number().optional() }),
  z.object({
    kind: z.literal('highlight'),
    target: z.string(),
    style: z.enum(['ring', 'pulse']).optional(),
  }),
  z.object({
    kind: z.literal('spawn'),
    thing: z.enum(['unit', 'ten', 'hundred', 'thousand', 'card']),
    qty: z.number(),
    to: z.string(),
  }),
  z.object({
    kind: z.literal('move'),
    target: z.string(),
    to: z.string(),
    qty: z.number().optional(),
  }),
  z.object({
    kind: z.literal('exchange'),
    column: z.enum(['units', 'tens', 'hundreds', 'thousands']),
  }),
  z.object({ kind: z.literal('prompt'), text: z.string(), token: z.string().optional() }),
  z.object({ kind: z.literal('gate-do'), expect: z.string(), hint: z.string().optional() }),
  z.object({ kind: z.literal('wait'), ms: z.number() }),
])

export const stepSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  actions: z.array(stepActionSchema),
})

export const stageSchema = z.object({
  id: z.string(),
  mode: z.enum(['tutorial', 'worked', 'practice']),
  heading: z.string().optional(),
  materialSlug: z.string(),
  materialConfig: z.union([goldenBeadsConfigSchema, stampGameConfigSchema]).optional(),
  steps: z.array(stepSchema).optional(),
  practiceTemplateId: z.string().optional(),
})

export const practiceTemplateSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  inputs: z.object({
    problems: z.array(practiceProblemSchema),
  }),
  answer: z.null(),
  meta: practiceMetaSchema.optional(),
})

export const lessonScriptSchema = z.object({
  lessonId: z.string(),
  version: z.string(),
  topicId: z.string().optional(),
  stages: z.array(stageSchema),
  practiceTemplates: z.array(practiceTemplateSchema).optional(),
})

export type StepAction = z.infer<typeof stepActionSchema>
export type Step = z.infer<typeof stepSchema>
export type Stage = z.infer<typeof stageSchema>
export type PracticeTemplate = z.infer<typeof practiceTemplateSchema>
export type LessonScript = z.infer<typeof lessonScriptSchema>
export type GoldenBeadsConfig = z.infer<typeof goldenBeadsConfigSchema>
export type StampGameConfig = z.infer<typeof stampGameConfigSchema>
