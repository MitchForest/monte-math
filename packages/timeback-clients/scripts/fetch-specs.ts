import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type Service = "qti" | "oneroster" | "caliper" | "powerpath" | "edubridge";
type SpecEnvironment = "staging" | "production";

type ServiceSpecSources = Partial<Record<SpecEnvironment, string>>;

type FetchResult = {
	service: Service;
	environment: SpecEnvironment;
	status: "downloaded" | "unchanged" | "skipped" | "failed";
	message?: string;
};

const SPEC_SOURCES: Record<Service, ServiceSpecSources> = {
	qti: {
		staging: "https://qti-staging.alpha-1edtech.com/openapi.yaml",
		production: "https://qti.alpha-1edtech.com/openapi.yaml",
	},
	oneroster: {
		staging: "https://api.staging.alpha-1edtech.com/openapi.yaml",
		production: "https://api.alpha-1edtech.com/openapi.yaml",
	},
	caliper: {
		staging: "https://caliper-staging.alpha-1edtech.com/openapi.yaml",
		production: "https://caliper.alpha-1edtech.com/openapi.yaml",
	},
	powerpath: {
		staging: "https://staging.alpha-1edtech.com/powerpath/openapi.yaml",
		production: "https://api.alpha-1edtech.com/powerpath/openapi.yaml",
	},
	edubridge: {
		staging: "https://api.staging.alpha-1edtech.com/edubridge/openapi.yaml",
		production: "https://api.alpha-1edtech.com/edubridge/openapi.yaml",
	},
};

const BASE_DIR = fileURLToPath(new URL("../openapi", import.meta.url));

const VALID_ENVS: SpecEnvironment[] = ["staging", "production"];

type CliOptions = {
	environments: SpecEnvironment[];
};

async function main() {
	const options = parseCliOptions(process.argv.slice(2));
	const results: FetchResult[] = [];

	for (const service of Object.keys(SPEC_SOURCES) as Service[]) {
		for (const environment of options.environments) {
			const sourceUrl = SPEC_SOURCES[service][environment];
			if (!sourceUrl) {
				results.push({
					service,
					environment,
					status: "skipped",
					message: "No source URL configured",
				});
				continue;
			}

			const result = await fetchAndPersistSpec(service, environment, sourceUrl);
			results.push(result);
		}
	}

	report(results);

	const failures = results.filter((result) => result.status === "failed");
	if (failures.length > 0) {
		process.exitCode = 1;
	}
}

async function fetchAndPersistSpec(
	service: Service,
	environment: SpecEnvironment,
	url: string,
): Promise<FetchResult> {
	try {
		const response = await fetch(url, {
			headers: {
				accept: "application/yaml, application/json;q=0.8, text/plain;q=0.5",
			},
		});

		if (!response.ok) {
			return {
				service,
				environment,
				status: "failed",
				message: `HTTP ${response.status}`,
			};
		}

		const content = await response.text();
		const outputPath = resolveSpecPath(service, environment);
		await ensureDirectory(dirname(outputPath));

		const existing = await readExistingFile(outputPath);
		if (existing === content) {
			return {
				service,
				environment,
				status: "unchanged",
			};
		}

		await writeFile(outputPath, content, "utf8");
		return {
			service,
			environment,
			status: "downloaded",
		};
	} catch (error) {
		return {
			service,
			environment,
			status: "failed",
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function resolveSpecPath(
	service: Service,
	environment: SpecEnvironment,
): string {
	const fileName = `${environment}.yaml`;
	return join(BASE_DIR, service, fileName);
}

async function ensureDirectory(path: string): Promise<void> {
	await mkdir(path, { recursive: true });
}

async function readExistingFile(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf8");
	} catch (error) {
		if (isFileNotFoundError(error)) {
			return null;
		}
		throw error;
	}
}

function isFileNotFoundError(error: unknown): boolean {
	return Boolean(
		error &&
			typeof error === "object" &&
			"code" in error &&
			(error as { code?: string }).code === "ENOENT",
	);
}

function report(results: FetchResult[]): void {
	for (const result of results) {
		const base = `[${result.service}:${result.environment}]`;
		const message = result.message ? ` ${result.message}` : "";
		process.stdout.write(`${base} ${result.status}${message}\n`);
	}
}

function parseCliOptions(argv: string[]): CliOptions {
	const environments: SpecEnvironment[] = [];

	for (const arg of argv) {
		const [flag, value] = arg.split("=");
		if (flag === "--env" || flag === "--environment") {
			if (!value) {
				continue;
			}
			const parts = value.split(",").map((part) => part.trim().toLowerCase());
			for (const part of parts) {
				if (isValidEnvironment(part)) {
					environments.push(part);
				}
			}
		}
	}

	if (environments.length === 0) {
		return { environments: VALID_ENVS };
	}

	const deduped = Array.from(new Set(environments));
	return { environments: deduped };
}

function isValidEnvironment(value: string): value is SpecEnvironment {
	return value === "staging" || value === "production";
}

await main();
