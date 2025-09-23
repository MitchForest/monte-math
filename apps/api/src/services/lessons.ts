import { promises as fs } from 'fs'
import path from 'path'

import { lessonScriptSchema } from '@monte/shared'
import type { LessonScript } from '@monte/shared'
import { sql } from 'kysely'

import { db } from '../db/client'
import type { NewLessonScript } from '../db/schema'

const CONTENT_ROOT = path.resolve(process.cwd(), '../../content/lessons')

function serializeLesson(script: LessonScript) {
  return JSON.stringify(script, null, 2)
}

async function readLessonFromContent(lessonId: string) {
  const lessonDir = path.join(CONTENT_ROOT, lessonId)
  const scriptPath = path.join(lessonDir, 'script.json')
  const raw = await fs.readFile(scriptPath, 'utf-8')
  return lessonScriptSchema.parse(JSON.parse(raw))
}

export async function getLessonScript(lessonId: string, version?: string) {
  const query = db.selectFrom('lesson_scripts').selectAll().where('lesson_id', '=', lessonId)

  const row = version
    ? await query.where('version', '=', version).executeTakeFirst()
    : await query
        .orderBy((eb) => eb.case().when('status', '=', 'draft').then(0).else(1).end())
        .orderBy('updated_at', 'desc')
        .executeTakeFirst()

  if (row) {
    return lessonScriptSchema.parse(JSON.parse(row.script))
  }

  const fallback = await readLessonFromContent(lessonId)
  await saveLessonScript(fallback, { status: 'published' })
  return fallback
}

export async function saveLessonScript(
  script: LessonScript,
  options: { status?: 'draft' | 'published' } = {}
) {
  const status = options.status ?? 'draft'
  const payload: NewLessonScript = {
    lesson_id: script.lessonId,
    version: script.version,
    status,
    script: serializeLesson(script),
  }

  if (status === 'published') {
    payload.published_at = new Date().toISOString()
  }

  await db
    .insertInto('lesson_scripts')
    .values(payload)
    .onConflict((oc) =>
      oc.columns(['lesson_id', 'version']).doUpdateSet({
        status: (eb) => eb.ref('excluded.status'),
        script: (eb) => eb.ref('excluded.script'),
        updated_at: sql`CURRENT_TIMESTAMP`,
        published_at: (eb) => eb.ref('excluded.published_at'),
      })
    )
    .execute()

  return script
}

export async function listPublishedLessonScripts() {
  const rows = await db
    .selectFrom('lesson_scripts')
    .selectAll()
    .where('status', '=', 'published')
    .execute()

  return rows.map((row) => lessonScriptSchema.parse(JSON.parse(row.script)))
}

export async function upsertLessonFromContent(script: LessonScript) {
  await saveLessonScript(script, { status: 'published' })
}
