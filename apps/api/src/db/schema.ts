import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely'

// Database schema types for Kysely
export interface Database {
  skills: SkillsTable
  skill_prerequisites: SkillPrerequisitesTable
  lesson_scripts: LessonScriptsTable
  users: UsersTable
  user_sessions: UserSessionsTable
  user_identities: UserIdentitiesTable
}

type GeneratedTimestamp = ColumnType<string, string | undefined, string>
type ImmutableTimestamp = ColumnType<string, string | undefined, never>

export interface SkillsTable {
  id: string // Primary key: 'S001', 'S002', etc.
  name: string
  description: string | null
  created_at: ImmutableTimestamp // SQLite stores dates as strings
  updated_at: GeneratedTimestamp
}

export interface SkillPrerequisitesTable {
  skill_id: string // Foreign key to skills.id
  prereq_id: string // Foreign key to skills.id (the prerequisite)
  created_at: ImmutableTimestamp
}

export interface LessonScriptsTable {
  lesson_id: string
  version: string
  status: 'draft' | 'published'
  script: string
  created_at: ImmutableTimestamp
  updated_at: GeneratedTimestamp
  published_at: ColumnType<string | null, string | null | undefined, string | null>
}

export interface UsersTable {
  id: string
  email: string | null
  email_verified_at: ColumnType<string | null, string | null | undefined, string | null>
  password_hash: string | null
  display_name: string | null
  avatar_seed: string
  created_at: ImmutableTimestamp
  updated_at: GeneratedTimestamp
}

export interface UserSessionsTable {
  id: string
  user_id: string
  hashed_session_token: string
  expires_at: string
  created_at: ImmutableTimestamp
  updated_at: GeneratedTimestamp
}

export interface UserIdentitiesTable {
  id: string
  user_id: string
  provider: 'github' | 'google'
  provider_user_id: string
  email: string | null
  created_at: ImmutableTimestamp
  updated_at: GeneratedTimestamp
}

// Types for selecting (what you get from DB)
export type Skill = Selectable<SkillsTable>
export type SkillPrerequisite = Selectable<SkillPrerequisitesTable>
export type LessonScriptRow = Selectable<LessonScriptsTable>
export type User = Selectable<UsersTable>
export type UserSession = Selectable<UserSessionsTable>
export type UserIdentity = Selectable<UserIdentitiesTable>

// Types for inserting (what you send to DB)
export type NewSkill = Insertable<SkillsTable>
export type NewSkillPrerequisite = Insertable<SkillPrerequisitesTable>
export type NewLessonScript = Insertable<LessonScriptsTable>
export type NewUser = Insertable<UsersTable>
export type NewUserSession = Insertable<UserSessionsTable>
export type NewUserIdentity = Insertable<UserIdentitiesTable>

export type UserUpdate = Updateable<UsersTable>
