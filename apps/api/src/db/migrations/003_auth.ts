import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text')
    .addColumn('email_verified_at', 'text')
    .addColumn('password_hash', 'text')
    .addColumn('display_name', 'text')
    .addColumn('avatar_seed', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_users_email').on('users').column('email').unique().execute()

  await db.schema
    .createTable('user_sessions')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('hashed_session_token', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('idx_user_sessions_user_id')
    .on('user_sessions')
    .column('user_id')
    .execute()

  await db.schema
    .createIndex('idx_user_sessions_token')
    .on('user_sessions')
    .column('hashed_session_token')
    .unique()
    .execute()

  await db.schema
    .createTable('user_identities')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('provider', 'text', (col) => col.notNull())
    .addColumn('provider_user_id', 'text', (col) => col.notNull())
    .addColumn('email', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('idx_user_identities_provider_user')
    .on('user_identities')
    .columns(['provider', 'provider_user_id'])
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_user_identities_provider_user').execute()
  await db.schema.dropTable('user_identities').execute()
  await db.schema.dropIndex('idx_user_sessions_token').execute()
  await db.schema.dropIndex('idx_user_sessions_user_id').execute()
  await db.schema.dropTable('user_sessions').execute()
  await db.schema.dropIndex('idx_users_email').execute()
  await db.schema.dropTable('users').execute()
}
