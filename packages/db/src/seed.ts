import { createDatabase } from './index.js'

async function main() {
  const db = createDatabase()
  try {
    // TODO: load CCSS and Montessori data from .docs into SQLite.
    console.info('Seeding not implemented yet.')
  } finally {
    await db.destroy()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
