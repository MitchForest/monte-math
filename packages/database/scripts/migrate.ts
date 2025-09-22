import { config } from "dotenv";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";
import process, { exit } from "node:process";
import { fileURLToPath } from "node:url";
import type { Kysely } from "kysely";
import { Migrator, FileMigrationProvider } from "kysely";

import { createDatabaseClient } from "../src/client";
import type { Database } from "../src/types";

async function main() {
	loadEnv();
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		console.error("DATABASE_URL is not set. Create packages/database/.env");
		exit(1);
	}

	const db = createDatabaseClient(connectionString, { ssl: resolveSslConfig() });

	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const migrationsPath = path.join(__dirname, "..", "migrations");
	
	console.log("Migrations path:", migrationsPath);

	const migrator = new Migrator({
		db: db as unknown as Kysely<Database>,
		provider: new FileMigrationProvider({
			fs: {
				readdir,
				readFile,
			},
			path,
			migrationFolder: migrationsPath,
		}),
	});

	try {
		const { error, results } = await migrator.migrateToLatest();
		for (const result of results ?? []) {
			if (!result) continue;
			const status = result.status === "Success" ? "applied" : result.status;
			console.info(`${status.padEnd(10)} ${result.migrationName}`);
		}

		if (error) {
			console.error("Migration failed", error);
			exit(1);
		}

		console.info("Migrations complete");
	} finally {
		await db.destroy();
	}
}

function loadEnv() {
	const envPath = path.resolve(process.cwd(), ".env");
	if (existsSync(envPath)) {
		config({ path: envPath });
	} else if (process.env.DATABASE_URL) {
		return;
	} else {
		console.warn("No .env file found in packages/database; relying on process env");
	}
}

function resolveSslConfig() {
	const sslMode = process.env.DATABASE_SSL_MODE;
	if (!sslMode || sslMode === "disable") {
		return undefined;
	}

	const rejectUnauthorized =
		process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
	return { rejectUnauthorized };
}

await main();
