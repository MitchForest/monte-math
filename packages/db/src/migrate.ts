import { createDatabase } from './index.js'

async function main() {
  const db = createDatabase()
  try {
    // TODO: wire up migrations
    console.info('No migrations defined yet.')
  } finally {
    await db.destroy()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
