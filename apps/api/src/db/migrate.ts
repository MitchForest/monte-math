#!/usr/bin/env bun
import { promises as fs } from 'fs'
import * as path from 'path'
import { db } from './client'
import { Migrator, FileMigrationProvider } from 'kysely'

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dir!, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('❌ Failed to migrate')
    console.error(error)
    process.exit(1)
  }

  console.log('✨ All migrations completed successfully')
  await db.destroy()
}

migrateToLatest()
