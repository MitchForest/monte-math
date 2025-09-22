import type { Kysely } from "kysely";
import { sql } from "kysely";

type DB = Kysely<unknown>;

export async function up(db: DB): Promise<void> {
	await sql`create extension if not exists "pgcrypto"`.execute(db);

	await db.schema
		.createTable("areas")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
		.addColumn("slug", "text", (col) => col.notNull())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("description", "text")
		.addColumn("order_index", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addUniqueConstraint("areas_slug_unique", ["slug"])
		.execute();

	await db.schema
		.createTable("domains")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
		.addColumn("area_id", "uuid", (col) => col.notNull())
		.addColumn("slug", "text", (col) => col.notNull())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("description", "text")
		.addColumn("order_index", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addUniqueConstraint("domains_slug_unique", ["slug"])
		.addForeignKeyConstraint("domains_area_id_fkey", ["area_id"], "areas", ["id"], (fk) =>
			fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createTable("topics")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
		.addColumn("domain_id", "uuid", (col) => col.notNull())
		.addColumn("slug", "text", (col) => col.notNull())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("description", "text")
		.addColumn("order_index", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addUniqueConstraint("topics_slug_unique", ["slug"])
		.addForeignKeyConstraint("topics_domain_id_fkey", ["domain_id"], "domains", ["id"], (fk) =>
			fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createTable("lessons")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
		.addColumn("topic_id", "uuid", (col) => col.notNull())
		.addColumn("slug", "text", (col) => col.notNull())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("summary", "text")
		.addColumn("order_index", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("estimated_duration_minutes", "integer")
		.addColumn("xp_reward", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addUniqueConstraint("lessons_slug_unique", ["slug"])
		.addForeignKeyConstraint("lessons_topic_id_fkey", ["topic_id"], "topics", ["id"], (fk) =>
			fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createTable("skills")
		.addColumn("id", "varchar(10)", (col) => col.primaryKey())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("abbreviation", "text")
		.addColumn("description", "text")
		.addColumn("difficulty", "smallint", (col) => col.notNull().defaultTo(1))
		.addColumn("xp_value", "smallint", (col) => col.notNull().defaultTo(10))
		.addColumn("primary_topic_id", "uuid")
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addForeignKeyConstraint(
			"skills_primary_topic_id_fkey",
			["primary_topic_id"],
			"topics",
			["id"],
			(fk) => fk.onDelete("set null"),
		)
		.execute();

	await db.schema
		.createTable("skill_topics")
		.addColumn("skill_id", "varchar(10)", (col) => col.notNull())
		.addColumn("topic_id", "uuid", (col) => col.notNull())
		.addColumn("is_primary", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("order_index", "integer", (col) => col.notNull().defaultTo(0))
		.addPrimaryKeyConstraint("skill_topics_pkey", ["skill_id", "topic_id"])
		.addForeignKeyConstraint("skill_topics_skill_id_fkey", ["skill_id"], "skills", ["id"], (fk) =>
			fk.onDelete("cascade"),
		)
		.addForeignKeyConstraint("skill_topics_topic_id_fkey", ["topic_id"], "topics", ["id"], (fk) =>
			fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createTable("lesson_skills")
		.addColumn("lesson_id", "uuid", (col) => col.notNull())
		.addColumn("skill_id", "varchar(10)", (col) => col.notNull())
		.addColumn("role", "text", (col) => col.notNull().defaultTo("primary"))
		.addPrimaryKeyConstraint("lesson_skills_pkey", ["lesson_id", "skill_id", "role"])
		.addForeignKeyConstraint(
			"lesson_skills_lesson_id_fkey",
			["lesson_id"],
			"lessons",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.addForeignKeyConstraint(
			"lesson_skills_skill_id_fkey",
			["skill_id"],
			"skills",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createTable("skill_prerequisites")
		.addColumn("skill_id", "varchar(10)", (col) => col.notNull())
		.addColumn("prerequisite_skill_id", "varchar(10)", (col) => col.notNull())
		.addColumn("is_optional", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("note", "text")
		.addPrimaryKeyConstraint("skill_prerequisites_pkey", ["skill_id", "prerequisite_skill_id"])
		.addForeignKeyConstraint(
			"skill_prerequisites_skill_id_fkey",
			["skill_id"],
			"skills",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.addForeignKeyConstraint(
			"skill_prerequisites_prereq_fkey",
			["prerequisite_skill_id"],
			"skills",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute();

	await db.schema
		.createIndex("domains_area_id_index")
		.on("domains")
		.column("area_id")
		.execute();

	await db.schema
		.createIndex("topics_domain_id_index")
		.on("topics")
		.column("domain_id")
		.execute();

	await db.schema
		.createIndex("lessons_topic_id_index")
		.on("lessons")
		.column("topic_id")
		.execute();

	await db.schema
		.createIndex("skill_topics_topic_id_index")
		.on("skill_topics")
		.column("topic_id")
		.execute();

	await db.schema
		.createIndex("skill_topics_skill_id_index")
		.on("skill_topics")
		.column("skill_id")
		.execute();
}

export async function down(db: DB): Promise<void> {
	await db.schema.dropIndex("skill_topics_skill_id_index").execute();
	await db.schema.dropIndex("skill_topics_topic_id_index").execute();
	await db.schema.dropIndex("lessons_topic_id_index").execute();
	await db.schema.dropIndex("topics_domain_id_index").execute();
	await db.schema.dropIndex("domains_area_id_index").execute();

	await db.schema.dropTable("skill_prerequisites").execute();
	await db.schema.dropTable("lesson_skills").execute();
	await db.schema.dropTable("skill_topics").execute();
	await db.schema.dropTable("skills").execute();
	await db.schema.dropTable("lessons").execute();
	await db.schema.dropTable("topics").execute();
	await db.schema.dropTable("domains").execute();
	await db.schema.dropTable("areas").execute();
}
