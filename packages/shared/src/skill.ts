import { z } from 'zod'

export const masteryStateSchema = z.enum([
  'not_started',
  'learning',
  'mastered',
  'review_due'
])

export const skillSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  name: z.string(),
  description: z.string().nullish()
})

export const skillPrerequisiteSchema = z.object({
  skillId: z.string(),
  prereqId: z.string()
})

export type MasteryState = z.infer<typeof masteryStateSchema>
export type Skill = z.infer<typeof skillSchema>
export type SkillPrerequisite = z.infer<typeof skillPrerequisiteSchema>
