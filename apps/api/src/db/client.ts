import { Kysely } from 'kysely'
import { BunSqliteDialect } from 'kysely-bun-sqlite'
import Database from 'bun:sqlite'
import type { Database as DatabaseSchema } from './schema'

// Create Bun SQLite database instance
const bunDb = new Database('monte.db')

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