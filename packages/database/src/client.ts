import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { Database } from "./types";

type CreateOptions = {
	ssl?: boolean | { rejectUnauthorized: boolean };
};

export const createDatabaseClient = (
	connectionString: string,
	options: CreateOptions = {},
) => {
	return new Kysely<Database>({
		dialect: new PostgresDialect({
			pool: new Pool({
				connectionString,
				ssl: options.ssl,
			}),
		}),
	});
};

export type { Database };
