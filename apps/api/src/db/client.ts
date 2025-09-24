import { Kysely } from 'kysely'
import { BunSqliteDialect } from 'kysely-bun-sqlite'
import Database from 'bun:sqlite'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import type { Database as DatabaseSchema } from './schema'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const defaultDbPath = resolve(moduleDir, '../../../../monte.db')
const dbPath = process.env.MONTE_DB_PATH ?? defaultDbPath

const bunDb = new Database(dbPath)

export const db = new Kysely<DatabaseSchema>({
  dialect: new BunSqliteDialect({
    database: bunDb,
  }),
})

// Helper to check if database is connected
export async function checkConnection() {
  try {
    await db.selectFrom('skills').select('id').limit(1).execute()
    return true
  } catch {
    return false
  }
}
