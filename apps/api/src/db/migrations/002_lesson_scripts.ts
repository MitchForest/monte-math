import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('lesson_scripts')
    .addColumn('lesson_id', 'text', (col) => col.notNull())
    .addColumn('version', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('published'))
    .addColumn('script', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('published_at', 'text')
    .addPrimaryKeyConstraint('pk_lesson_scripts', ['lesson_id', 'version'])
    .execute()

  await db.schema
    .createIndex('idx_lesson_scripts_status')
    .on('lesson_scripts')
    .column('status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_lesson_scripts_status').execute()
  await db.schema.dropTable('lesson_scripts').execute()
}
