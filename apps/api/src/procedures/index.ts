import { implement, ORPCError } from '@orpc/server'
import { z } from 'zod'

import {
  appContract,
  lessonScriptSchema,
  skillSchema,
  skillPrerequisiteSchema,
} from '@monte/shared'
import { db } from '../db/client'
import type { User, UserSession } from '../db/schema'
import { getLessonScript, saveLessonScript } from '../services/lessons'
import {
  beginOAuthFlow,
  completeOAuthFlow,
  issueJwtForSession,
  loginWithPassword,
  logout as logoutSession,
  registerWithPassword,
} from '../services/auth'
import {
  toUserProfile,
  updateDisplayName,
  regenerateAvatar,
  changePassword as changeUserPassword,
} from '../services/auth/profile'

interface RequestContext {
  headers: Record<string, string>
  session?: UserSession
  user?: User
  setCookie?: (value: string) => void
}

const authImplementation = implement(appContract.auth)
  .$context<RequestContext>()
  .router({
    register: implement(appContract.auth.register)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const result = await registerWithPassword({
          email: input.email,
          password: input.password,
          displayName: input.displayName,
        })

        context?.setCookie?.(result.cookie)

        return {
          user: result.user,
          session: result.session,
        }
      }),
    login: implement(appContract.auth.login)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const result = await loginWithPassword({
          email: input.email,
          password: input.password,
        })

        context?.setCookie?.(result.cookie)

        return {
          user: result.user,
          session: result.session,
        }
      }),
    logout: implement(appContract.auth.logout)
      .$context<RequestContext>()
      .handler(async ({ context }) => {
        const session = context?.session
        if (!session) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        const cookie = await logoutSession(session.id)
        context?.setCookie?.(cookie)

        return { success: true as const }
      }),
    me: implement(appContract.auth.me)
      .$context<RequestContext>()
      .handler(async ({ context }) => {
        const session = context?.session
        const user = context?.user

        if (!session || !user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        return {
          user: toUserProfile(user),
          session: {
            id: session.id,
            expiresAt: session.expires_at,
          },
        }
      }),
    beginOAuth: implement(appContract.auth.beginOAuth)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        const result = await beginOAuthFlow(input.provider)
        return result
      }),
    completeOAuth: implement(appContract.auth.completeOAuth)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const result = await completeOAuthFlow(input.provider, {
          code: input.code,
          state: input.state,
          redirectUri: input.redirectUri,
          codeVerifier: input.codeVerifier,
        })

        context?.setCookie?.(result.cookie)

        return {
          user: result.user,
          session: result.session,
        }
      }),
    issueJwt: implement(appContract.auth.issueJwt)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const session = context?.session
        const user = context?.user

        if (!session || !user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        const result = await issueJwtForSession({
          userId: user.id,
          sessionId: session.id,
          audience: input.audience,
          expiresInSeconds: input.expiresInSeconds,
        })

        return {
          token: result.token,
          expiresAt: result.expiresAt.toISOString(),
        }
      }),
  })

const skillsImplementation = implement(appContract.skills)
  .$context<RequestContext>()
  .router({
    list: implement(appContract.skills.list)
      .$context<RequestContext>()
      .handler(async () => {
        const skills = await db.selectFrom('skills').select(['id', 'name', 'description']).execute()

        const prerequisites = await db
          .selectFrom('skill_prerequisites')
          .select(['skill_id as skillId', 'prereq_id as prereqId'])
          .execute()

        return {
          skills: z.array(skillSchema).parse(
            skills.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description,
            }))
          ),
          prerequisites: z.array(skillPrerequisiteSchema).parse(prerequisites),
        }
      }),
    get: implement(appContract.skills.get)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        const skill = await db
          .selectFrom('skills')
          .select(['id', 'name', 'description'])
          .where('id', '=', input.id)
          .executeTakeFirst()

        if (!skill) {
          throw new ORPCError('NOT_FOUND', {
            message: `Skill ${input.id} not found`,
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
            description: skill.description,
          }),
          prerequisites: z.array(skillSchema).parse(
            prerequisites.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description,
            }))
          ),
          dependents: z.array(skillSchema).parse(
            dependents.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description,
            }))
          ),
        }
      }),
    update: implement(appContract.skills.update)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        const update: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
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
            message: `Skill ${input.id} not found`,
          })
        }

        return skillSchema.parse({
          id: result.id,
          name: result.name,
          description: result.description,
        })
      }),
    addPrerequisite: implement(appContract.skills.addPrerequisite)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        if (input.skillId === input.prereqId) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'A skill cannot depend on itself',
          })
        }

        await db
          .insertInto('skill_prerequisites')
          .values({
            skill_id: input.skillId,
            prereq_id: input.prereqId,
          })
          .onConflict((oc) => oc.doNothing())
          .execute()

        return { success: true as const }
      }),
    removePrerequisite: implement(appContract.skills.removePrerequisite)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        await db
          .deleteFrom('skill_prerequisites')
          .where('skill_id', '=', input.skillId)
          .where('prereq_id', '=', input.prereqId)
          .execute()

        return { success: true as const }
      }),
  })

const lessonsImplementation = implement(appContract.lessons)
  .$context<RequestContext>()
  .router({
    getScript: implement(appContract.lessons.getScript)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        try {
          return await getLessonScript(input.lessonId, input.version)
        } catch {
          throw new ORPCError('NOT_FOUND', {
            message: `Lesson ${input.lessonId} not found`,
          })
        }
      }),
    saveScript: implement(appContract.lessons.saveScript)
      .$context<RequestContext>()
      .handler(async ({ input }) => {
        const script = lessonScriptSchema.parse(input.script)
        await saveLessonScript(script, { status: input.publish ? 'published' : 'draft' })
        return script
      }),
  })

const engineImplementation = implement(appContract.engine)
  .$context<RequestContext>()
  .router({
    getNextTask: implement(appContract.engine.getNextTask)
      .$context<RequestContext>()
      .handler(async () => ({
        kind: 'lesson',
        lessonId: 'lesson-07-column-addition-golden-beads',
        version: '0.1.0',
        estimatedXP: 12,
      })),
    recordAttempt: implement(appContract.engine.recordAttempt)
      .$context<RequestContext>()
      .handler(async () => ({
        success: true as const,
      })),
  })

const xpImplementation = implement(appContract.xp)
  .$context<RequestContext>()
  .router({
    getProgress: implement(appContract.xp.getProgress)
      .$context<RequestContext>()
      .handler(async () => ({
        todayXP: 45,
        goal: 100,
        streak: 7,
      })),
    updateGoal: implement(appContract.xp.updateGoal)
      .$context<RequestContext>()
      .handler(async () => ({
        success: true as const,
      })),
  })

const profileImplementation = implement(appContract.profile)
  .$context<RequestContext>()
  .router({
    updateDisplayName: implement(appContract.profile.updateDisplayName)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const user = context?.user
        if (!user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        return updateDisplayName(user.id, input.displayName)
      }),
    regenerateAvatar: implement(appContract.profile.regenerateAvatar)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const user = context?.user
        if (!user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        return regenerateAvatar(user.id, input.seed)
      }),
    changePassword: implement(appContract.profile.changePassword)
      .$context<RequestContext>()
      .handler(async ({ input, context }) => {
        const user = context?.user
        if (!user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Session required' })
        }

        return changeUserPassword(user.id, input.currentPassword, input.newPassword)
      }),
  })

export const appRouter = implement(appContract).$context<RequestContext>().router({
  auth: authImplementation,
  profile: profileImplementation,
  skills: skillsImplementation,
  lessons: lessonsImplementation,
  engine: engineImplementation,
  xp: xpImplementation,
})

export type AppRouter = typeof appRouter
