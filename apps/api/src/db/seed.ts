#!/usr/bin/env bun
import path from 'path'
import { promises as fs } from 'fs'

import { lessonScriptSchema } from '@monte/shared'

import { db } from './client'
import skillsData from '../../../../content/skills/graph.json'
import type { NewSkill, NewSkillPrerequisite } from './schema'
import { saveLessonScript } from '../services/lessons'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Clear existing data
    await db.deleteFrom('lesson_scripts').execute()
    await db.deleteFrom('skill_prerequisites').execute()
    await db.deleteFrom('skills').execute()
    console.log('✅ Cleared existing data')

    // Insert skills
    const skillsToInsert: NewSkill[] = skillsData.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: null
    }))

    await db
      .insertInto('skills')
      .values(skillsToInsert)
      .execute()
    
    console.log(`✅ Inserted ${skillsToInsert.length} skills`)

    // Insert prerequisites
    if (skillsData.prerequisites) {
      const prerequisitesToInsert: NewSkillPrerequisite[] = []
      
      // Prerequisites is an object where key is skill_id and value is array of prereq_ids
      for (const [skillId, prereqIds] of Object.entries(skillsData.prerequisites)) {
        if (Array.isArray(prereqIds)) {
          for (const prereqId of prereqIds) {
            prerequisitesToInsert.push({
              skill_id: skillId,
              prereq_id: prereqId as string
            })
          }
        }
      }

      if (prerequisitesToInsert.length > 0) {
        await db
          .insertInto('skill_prerequisites')
          .values(prerequisitesToInsert)
          .execute()
        
        console.log(`✅ Inserted ${prerequisitesToInsert.length} prerequisites`)
      }
    }

    // Verify the data
    const skillCount = await db
      .selectFrom('skills')
      .select(db.fn.countAll().as('count'))
      .executeTakeFirst()
    
    const prereqCount = await db
      .selectFrom('skill_prerequisites')
      .select(db.fn.countAll().as('count'))
      .executeTakeFirst()

    // Seed lessons
    const lessonsDir = path.resolve(process.cwd(), '../../content/lessons')
    const lessonIds = await fs.readdir(lessonsDir)

    let lessonTotal = 0
    for (const lessonId of lessonIds) {
      const scriptPath = path.join(lessonsDir, lessonId, 'script.json')
      try {
        const raw = await fs.readFile(scriptPath, 'utf-8')
        const script = lessonScriptSchema.parse(JSON.parse(raw))
        await saveLessonScript(script, { status: 'published' })
        lessonTotal += 1
      } catch (error) {
        console.warn(`⚠️  Skipping lesson ${lessonId}: ${error}`)
      }
    }

    console.log('\n📊 Database summary:')
    console.log(`   Skills: ${skillCount?.count || 0}`)
    console.log(`   Prerequisites: ${prereqCount?.count || 0}`)
    console.log(`   Lessons: ${lessonTotal}`)
    console.log('\n✨ Seeding completed successfully!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

seed()
