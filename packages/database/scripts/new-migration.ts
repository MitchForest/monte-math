import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../migrations",
);

async function main() {
	const name = process.argv[2];
	if (!name) {
		console.error("Usage: bun run scripts/new-migration.ts <name>");
		process.exit(1);
	}

	const fileName = `${timestamp()}_${slugify(name)}.ts`;
	const filePath = resolve(MIGRATIONS_DIR, fileName);

	await mkdir(MIGRATIONS_DIR, { recursive: true });
	await writeFile(filePath, buildTemplate(name), "utf8");

	console.info(`Created migration ${fileName}`);
}

function timestamp(): string {
	const now = new Date();
	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(now.getUTCDate()).padStart(2, "0");
	const hh = String(now.getUTCHours()).padStart(2, "0");
	const mi = String(now.getUTCMinutes()).padStart(2, "0");
	const ss = String(now.getUTCSeconds()).padStart(2, "0");
	return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function buildTemplate(name: string): string {
	return `import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	// TODO: implement migration: ${name}
}

export async function down(db: Kysely<unknown>): Promise<void> {
	// TODO: rollback migration: ${name}
}
`;
}

await main();
