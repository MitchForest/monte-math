import { oc } from '@orpc/contract'
import { z } from 'zod'

import { lessonScriptSchema } from '../lesson'
import { masteryStateSchema, skillPrerequisiteSchema, skillSchema } from '../skill'
import { attemptSchema, nextTaskSchema, xpProgressSchema } from '../types'
import {
  authResultSchema,
  beginOAuthInputSchema,
  beginOAuthOutputSchema,
  completeOAuthInputSchema,
  jwtIssueInputSchema,
  jwtIssueOutputSchema,
  loginInputSchema,
  registrationInputSchema,
  sessionSchema,
  userProfileSchema
} from '../auth'

const skillWithRelationsSchema = skillSchema.extend({
  prerequisites: z.array(skillSchema).default([]),
  dependents: z.array(skillSchema).default([]),
  mastery: masteryStateSchema.optional()
})

const skillUpdateInput = z
  .object({
    id: z.string(),
    name: z.string().min(1).max(120).optional(),
    description: z.string().nullable().optional()
  })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: 'Provide at least one field to update',
    path: ['name']
  })

const prereqEdgeInput = z.object({
  skillId: z.string(),
  prereqId: z.string()
})

const saveLessonInput = z.object({
  script: lessonScriptSchema,
  publish: z.boolean().optional()
})

export const authContract = oc.router({
  register: oc.input(registrationInputSchema).output(authResultSchema),
  login: oc.input(loginInputSchema).output(authResultSchema),
  logout: oc.output(z.object({ success: z.literal(true) })),
  me: oc.output(
    z.object({
      user: userProfileSchema,
      session: sessionSchema
    })
  ),
  beginOAuth: oc
    .input(beginOAuthInputSchema)
    .output(beginOAuthOutputSchema),
  completeOAuth: oc
    .input(completeOAuthInputSchema)
    .output(authResultSchema),
  issueJwt: oc.input(jwtIssueInputSchema).output(jwtIssueOutputSchema)
})

export const skillsContract = oc.router({
  list: oc
    .output(
      z.object({
        skills: z.array(skillSchema),
        prerequisites: z.array(skillPrerequisiteSchema)
      })
    ),
  get: oc
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        skill: skillWithRelationsSchema,
        prerequisites: z.array(skillSchema),
        dependents: z.array(skillSchema)
      })
    ),
  update: oc.input(skillUpdateInput).output(skillSchema),
  addPrerequisite: oc.input(prereqEdgeInput).output(z.object({ success: z.literal(true) })),
  removePrerequisite: oc.input(prereqEdgeInput).output(z.object({ success: z.literal(true) }))
})

export const lessonsContract = oc.router({
  getScript: oc
    .input(
      z.object({
        lessonId: z.string(),
        version: z.string().optional()
      })
    )
    .output(lessonScriptSchema),
  saveScript: oc
    .input(saveLessonInput)
    .output(lessonScriptSchema)
})

export const engineContract = oc.router({
  getNextTask: oc
    .input(z.object({ userId: z.string() }))
    .output(nextTaskSchema),
  recordAttempt: oc
    .input(attemptSchema)
    .output(
      z.object({
        success: z.literal(true),
        masteryUpdate: z
          .object({
            skillId: z.string(),
            newMastery: masteryStateSchema
          })
          .optional()
      })
    )
})

export const xpContract = oc.router({
  getProgress: oc
    .input(z.object({ userId: z.string() }))
    .output(xpProgressSchema),
  updateGoal: oc
    .input(z.object({ userId: z.string(), goal: z.number().int().min(1) }))
    .output(z.object({ success: z.literal(true) }))
})

export const appContract = oc.router({
  auth: authContract,
  skills: skillsContract,
  lessons: lessonsContract,
  engine: engineContract,
  xp: xpContract
})

export type AppContract = typeof appContract
