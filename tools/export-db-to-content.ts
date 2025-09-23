#!/usr/bin/env bun
import { promises as fs } from 'fs'
import path from 'path'

import { listPublishedLessonScripts } from '../apps/api/src/services/lessons'
import { db } from '../apps/api/src/db/client'

async function exportSkills() {
  const skills = await db.selectFrom('skills').select(['id', 'name']).orderBy('id').execute()

  const prereqRows = await db
    .selectFrom('skill_prerequisites')
    .select(['skill_id as skillId', 'prereq_id as prereqId'])
    .execute()

  const prereqs: Record<string, string[]> = {}
  prereqRows.forEach(({ skillId, prereqId }) => {
    if (!prereqs[skillId]) prereqs[skillId] = []
    prereqs[skillId].push(prereqId)
  })

  Object.keys(prereqs).forEach((key) => {
    prereqs[key] = prereqs[key].sort()
  })

  const numEdges = prereqRows.length
  const payload = {
    skills: skills.map((row) => ({ id: row.id, name: row.name })),
    prerequisites: prereqs,
    stats: {
      num_skills: skills.length,
      num_edges: numEdges,
    },
  }

  const target = path.resolve(process.cwd(), 'content/skills/graph.json')
  await fs.writeFile(target, JSON.stringify(payload, null, 2) + '\n', 'utf-8')
  console.log(`📤 Wrote skills graph to ${target}`)
}

async function exportLessons() {
  const lessons = await listPublishedLessonScripts()
  const root = path.resolve(process.cwd(), 'content/lessons')

  await Promise.all(
    lessons.map(async (lesson) => {
      const dir = path.join(root, lesson.lessonId)
      await fs.mkdir(dir, { recursive: true })
      const file = path.join(dir, 'script.json')
      await fs.writeFile(file, JSON.stringify(lesson, null, 2) + '\n', 'utf-8')
      console.log(`📤 Wrote lesson ${lesson.lessonId} v${lesson.version}`)
    })
  )
}

async function main() {
  try {
    await exportSkills()
    await exportLessons()
    console.log('✨ Content export complete')
  } finally {
    await db.destroy()
  }
}

main().catch((error) => {
  console.error('❌ Failed to export content', error)
  process.exit(1)
})
