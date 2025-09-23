import type { Generated } from 'kysely'

// Database schema types for Kysely
export interface Database {
  skills: SkillsTable
  skill_prerequisites: SkillPrerequisitesTable
  lesson_scripts: LessonScriptsTable
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

// Types for selecting (what you get from DB)
export type Skill = SkillsTable
export type SkillPrerequisite = SkillPrerequisitesTable
export type LessonScriptRow = LessonScriptsTable

// Types for inserting (what you send to DB)
export type NewSkill = Omit<SkillsTable, 'created_at' | 'updated_at'>
export type NewSkillPrerequisite = Omit<SkillPrerequisitesTable, 'created_at'>
export type NewLessonScript = Omit<LessonScriptsTable, 'created_at' | 'updated_at' | 'published_at'> & {
  published_at?: string | null
}
