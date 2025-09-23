import { z } from 'zod'

export const Skill = z.object({
  id: z.string(),
  code: z.string().optional(),
  name: z.string(),
  description: z.string().optional()
})

export const SkillPrereq = z.object({
  skillId: z.string(),
  prereqId: z.string()
})

export const MasteryState = z.enum(['not_started', 'learning', 'mastered', 'review_due'])

export type Skill = z.infer<typeof Skill>
export type SkillPrereq = z.infer<typeof SkillPrereq>
export type MasteryState = z.infer<typeof MasteryState>