import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'

export interface DatabaseSchema {}

export type MonteMathDatabase = Kysely<DatabaseSchema>

export const createDatabase = (filename = 'monte-math.db'): MonteMathDatabase => {
  const sqlite = new Database(filename)

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  })
}
