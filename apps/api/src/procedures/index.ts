import { implement, ORPCError } from '@orpc/server'
import { z } from 'zod'

import {
  appContract,
  lessonScriptSchema,
  skillSchema,
  skillPrerequisiteSchema
} from '@monte/shared'
import { db } from '../db/client'
import {
  getLessonScript,
  saveLessonScript
} from '../services/lessons'

const skillsImplementation = implement(appContract.skills).router({
  list: implement(appContract.skills.list).handler(async () => {
    const skills = await db
      .selectFrom('skills')
      .select(['id', 'name', 'description'])
      .execute()

    const prerequisites = await db
      .selectFrom('skill_prerequisites')
      .select(['skill_id as skillId', 'prereq_id as prereqId'])
      .execute()

    return {
      skills: z.array(skillSchema).parse(
        skills.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description
        }))
      ),
      prerequisites: z.array(skillPrerequisiteSchema).parse(prerequisites)
    }
  }),
  get: implement(appContract.skills.get).handler(async ({ input }) => {
    const skill = await db
      .selectFrom('skills')
      .select(['id', 'name', 'description'])
      .where('id', '=', input.id)
      .executeTakeFirst()

    if (!skill) {
      throw new ORPCError('NOT_FOUND', {
        message: `Skill ${input.id} not found`
      })
    }

    const prerequisites = await db
      .selectFrom('skill_prerequisites as sp')
      .innerJoin('skills as s', 's.id', 'sp.prereq_id')
      .select(['s.id', 's.name', 's.description'])
      .where('sp.skill_id', '=', input.id)
      .execute()

    const dependents = await db
      .selectFrom('skill_prerequisites as sp')
      .innerJoin('skills as s', 's.id', 'sp.skill_id')
      .select(['s.id', 's.name', 's.description'])
      .where('sp.prereq_id', '=', input.id)
      .execute()

    return {
      skill: skillSchema.parse({
        id: skill.id,
        name: skill.name,
        description: skill.description
      }),
      prerequisites: z.array(skillSchema).parse(
        prerequisites.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description
        }))
      ),
      dependents: z.array(skillSchema).parse(
        dependents.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description
        }))
      )
    }
  }),
  update: implement(appContract.skills.update).handler(async ({ input }) => {
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (input.name !== undefined) update.name = input.name
    if (input.description !== undefined) update.description = input.description

    const result = await db
      .updateTable('skills')
      .set(update)
      .where('id', '=', input.id)
      .returning(['id', 'name', 'description'])
      .executeTakeFirst()

    if (!result) {
      throw new ORPCError('NOT_FOUND', {
        message: `Skill ${input.id} not found`
      })
    }

    return skillSchema.parse({
      id: result.id,
      name: result.name,
      description: result.description
    })
  }),
  addPrerequisite: implement(appContract.skills.addPrerequisite).handler(async ({ input }) => {
    if (input.skillId === input.prereqId) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'A skill cannot depend on itself'
      })
    }

    await db
      .insertInto('skill_prerequisites')
      .values({
        skill_id: input.skillId,
        prereq_id: input.prereqId
      })
      .onConflict((oc) => oc.doNothing())
      .execute()

    return { success: true as const }
  }),
  removePrerequisite: implement(appContract.skills.removePrerequisite).handler(async ({ input }) => {
    await db
      .deleteFrom('skill_prerequisites')
      .where('skill_id', '=', input.skillId)
      .where('prereq_id', '=', input.prereqId)
      .execute()

    return { success: true as const }
  })
})

const lessonsImplementation = implement(appContract.lessons).router({
  getScript: implement(appContract.lessons.getScript).handler(async ({ input }) => {
    try {
      return await getLessonScript(input.lessonId, input.version)
    } catch (error) {
      throw new ORPCError('NOT_FOUND', {
        message: `Lesson ${input.lessonId} not found`
      })
    }
  }),
  saveScript: implement(appContract.lessons.saveScript).handler(async ({ input }) => {
    const script = lessonScriptSchema.parse(input.script)
    await saveLessonScript(script, { status: input.publish ? 'published' : 'draft' })
    return script
  })
})

const engineImplementation = implement(appContract.engine).router({
  getNextTask: implement(appContract.engine.getNextTask).handler(async () => ({
    kind: 'lesson',
    lessonId: 'lesson-07-column-addition-golden-beads',
    version: '0.1.0',
    estimatedXP: 12
  })),
  recordAttempt: implement(appContract.engine.recordAttempt).handler(async () => ({
    success: true as const
  }))
})

const xpImplementation = implement(appContract.xp).router({
  getProgress: implement(appContract.xp.getProgress).handler(async () => ({
    todayXP: 45,
    goal: 100,
    streak: 7
  })),
  updateGoal: implement(appContract.xp.updateGoal).handler(async () => ({
    success: true as const
  }))
})

export const appRouter = implement(appContract).router({
  skills: skillsImplementation,
  lessons: lessonsImplementation,
  engine: engineImplementation,
  xp: xpImplementation
})

export type AppRouter = typeof appRouter
