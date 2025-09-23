import { sql } from 'kysely'

import { db } from '../../db/client'
import type {
  NewUser,
  NewUserIdentity,
  NewUserSession,
  User,
  UserIdentity,
  UserSession
} from '../../db/schema'

export async function insertUser(user: NewUser): Promise<User> {
  return db
    .insertInto('users')
    .values(user)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
  return db
    .updateTable('users')
    .set({ ...updates, updated_at: sql`CURRENT_TIMESTAMP` })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst()
}

export async function findUserById(id: string): Promise<User | undefined> {
  return db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function insertSession(session: NewUserSession): Promise<UserSession> {
  return db
    .insertInto('user_sessions')
    .values(session)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deleteSessionById(sessionId: string): Promise<void> {
  await db.deleteFrom('user_sessions').where('id', '=', sessionId).execute()
}

export async function findSessionById(sessionId: string): Promise<UserSession | undefined> {
  return db
    .selectFrom('user_sessions')
    .selectAll()
    .where('id', '=', sessionId)
    .executeTakeFirst()
}

export async function deleteSessionsByUserId(userId: string): Promise<void> {
  await db.deleteFrom('user_sessions').where('user_id', '=', userId).execute()
}

export async function findSessionByTokenHash(hash: string): Promise<UserSession | undefined> {
  return db
    .selectFrom('user_sessions')
    .selectAll()
    .where('hashed_session_token', '=', hash)
    .executeTakeFirst()
}

export async function upsertIdentity(identity: NewUserIdentity): Promise<UserIdentity> {
  return db
    .insertInto('user_identities')
    .values(identity)
    .onConflict((oc) =>
      oc
        .columns(['provider', 'provider_user_id'])
        .doUpdateSet({
          user_id: (eb) => eb.ref('excluded.user_id'),
          email: (eb) => eb.ref('excluded.email'),
          updated_at: sql`CURRENT_TIMESTAMP`
        })
    )
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function findIdentity(provider: string, providerUserId: string) {
  return db
    .selectFrom('user_identities')
    .selectAll()
    .where('provider', '=', provider)
    .where('provider_user_id', '=', providerUserId)
    .executeTakeFirst()
}
