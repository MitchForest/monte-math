import type { Generated } from 'kysely'

// Database schema types for Kysely
export interface Database {
  skills: SkillsTable
  skill_prerequisites: SkillPrerequisitesTable
  lesson_scripts: LessonScriptsTable
  users: UsersTable
  user_sessions: UserSessionsTable
  user_identities: UserIdentitiesTable
}

export interface SkillsTable {
  id: string                    // Primary key: 'S001', 'S002', etc.
  name: string
  description: string | null
  created_at: Generated<string> // SQLite stores dates as strings
  updated_at: Generated<string>
}

export interface SkillPrerequisitesTable {
  skill_id: string              // Foreign key to skills.id
  prereq_id: string             // Foreign key to skills.id (the prerequisite)
  created_at: Generated<string>
}

export interface LessonScriptsTable {
  lesson_id: string
  version: string
  status: 'draft' | 'published'
  script: string
  created_at: Generated<string>
  updated_at: Generated<string>
  published_at: string | null
}

export interface UsersTable {
  id: string
  email: string | null
  email_verified_at: string | null
  password_hash: string | null
  display_name: string | null
  avatar_seed: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

export interface UserSessionsTable {
  id: string
  user_id: string
  hashed_session_token: string
  expires_at: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

export interface UserIdentitiesTable {
  id: string
  user_id: string
  provider: 'github' | 'google'
  provider_user_id: string
  email: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// Types for selecting (what you get from DB)
export type Skill = SkillsTable
export type SkillPrerequisite = SkillPrerequisitesTable
export type LessonScriptRow = LessonScriptsTable
export type User = UsersTable
export type UserSession = UserSessionsTable
export type UserIdentity = UserIdentitiesTable

// Types for inserting (what you send to DB)
export type NewSkill = Omit<SkillsTable, 'created_at' | 'updated_at'>
export type NewSkillPrerequisite = Omit<SkillPrerequisitesTable, 'created_at'>
export type NewLessonScript = Omit<LessonScriptsTable, 'created_at' | 'updated_at' | 'published_at'> & {
  published_at?: string | null
}
export type NewUser = Omit<UsersTable, 'created_at' | 'updated_at' | 'email_verified_at'> & {
  email_verified_at?: string | null
}
export type NewUserSession = Omit<UserSessionsTable, 'created_at' | 'updated_at'>
export type NewUserIdentity = Omit<UserIdentitiesTable, 'created_at' | 'updated_at'>
