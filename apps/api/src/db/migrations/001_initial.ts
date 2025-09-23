import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create skills table
  await db.schema
    .createTable('skills')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'text', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()

  // Create skill_prerequisites table
  await db.schema
    .createTable('skill_prerequisites')
    .addColumn('skill_id', 'text', (col) => 
      col.notNull().references('skills.id').onDelete('cascade')
    )
    .addColumn('prereq_id', 'text', (col) => 
      col.notNull().references('skills.id').onDelete('cascade')
    )
    .addColumn('created_at', 'text', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addPrimaryKeyConstraint('pk_skill_prerequisites', ['skill_id', 'prereq_id'])
    .execute()

  // Create indexes for better query performance
  await db.schema
    .createIndex('idx_skill_prerequisites_skill_id')
    .on('skill_prerequisites')
    .column('skill_id')
    .execute()

  await db.schema
    .createIndex('idx_skill_prerequisites_prereq_id')
    .on('skill_prerequisites')
    .column('prereq_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('skill_prerequisites').execute()
  await db.schema.dropTable('skills').execute()
}