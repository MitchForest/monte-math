#!/usr/bin/env bun
import { validate, smokeTest, publish } from '@monte/content-builder'
import type { LessonScript } from '@monte/shared'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

async function loadLessons(): Promise<LessonScript[]> {
  const contentDir = join(process.cwd(), 'content', 'lessons')
  const lessons: LessonScript[] = []
  
  try {
    const dirs = await readdir(contentDir)
    
    for (const dir of dirs) {
      const scriptPath = join(contentDir, dir, 'script.json')
      try {
        const content = await readFile(scriptPath, 'utf-8')
        const script = JSON.parse(content)
        lessons.push(script)
      } catch (e) {
        console.log(`No script.json found in ${dir}, skipping...`)
      }
    }
  } catch (e) {
    console.log('No lessons found in content/lessons')
  }
  
  return lessons
}

async function main() {
  console.log('🔨 Building content...\n')
  
  const lessons = await loadLessons()
  
  if (lessons.length === 0) {
    console.log('No lessons to build')
    return
  }
  
  for (const lesson of lessons) {
    try {
      console.log(`Processing ${lesson.lessonId}...`)
      
      // Validate schema
      const validated = validate(lesson)
      console.log(`  ✅ Validated`)
      
      // Run smoke tests
      await smokeTest(validated)
      console.log(`  ✅ Smoke test passed`)
      
      // Publish (dry run for now)
      await publish(validated, { dryRun: true })
      console.log(`  ✅ Published (dry run)\n`)
      
    } catch (error) {
      console.error(`  ❌ Error processing ${lesson.lessonId}:`, error)
    }
  }
  
  console.log('✨ Content build complete!')
}

main().catch(console.error)