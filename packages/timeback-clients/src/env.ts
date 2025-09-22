import { z } from "zod";

export type TimebackService =
	| "qti"
	| "oneroster"
	| "caliper"
	| "powerpath"
	| "edubridge";
export type TimebackEnvironment = "staging" | "production";

const DEFAULT_TOKEN_ENDPOINTS: Record<TimebackEnvironment, string> = {
	staging:
		"https://alpha-auth-development-idp.auth.us-west-2.amazoncognito.com/oauth2/token",
	production:
		"https://alpha-auth-production-idp.auth.us-west-2.amazoncognito.com/oauth2/token",
};

const RawEnvSchema = z.object({
	TIMEBACK_ENVIRONMENT: z.string().optional(),
	TIMEBACK_ENV: z.string().optional(),
	TIMEBACK_DEFAULT_ENVIRONMENT: z.string().optional(),
	TIMEBACK_TOKEN_URL: z.string().optional(),
	TIMEBACK_STAGING_TOKEN_URL: z.string().optional(),
	TIMEBACK_PRODUCTION_TOKEN_URL: z.string().optional(),
	TIMEBACK_SCOPE: z.string().optional(),
	TIMEBACK_STAGING_SCOPE: z.string().optional(),
	TIMEBACK_PRODUCTION_SCOPE: z.string().optional(),
	STAGING_CLIENT_ID: z.string().optional(),
	STAGING_CLIENT_SECRET: z.string().optional(),
	PROD_CLIENT_ID: z.string().optional(),
	PROD_CLIENT_SECRET: z.string().optional(),
	STAGING_AUTH_API: z.string().optional(),
	PROD_AUTH_API: z.string().optional(),
	STAGING_SCOPE: z.string().optional(),
	PROD_SCOPE: z.string().optional(),

	QTI_STAGING_API_URL: z.string().optional(),
	QTI_PROD_API_URL: z.string().optional(),
	QTI_API_URL: z.string().optional(),
	QTI_CLIENT_ID: z.string().optional(),
	QTI_CLIENT_SECRET: z.string().optional(),
	QTI_STAGING_CLIENT_ID: z.string().optional(),
	QTI_STAGING_CLIENT_SECRET: z.string().optional(),
	QTI_PRODUCTION_CLIENT_ID: z.string().optional(),
	QTI_PRODUCTION_CLIENT_SECRET: z.string().optional(),
	QTI_SCOPE: z.string().optional(),

	ONEROSTER_STAGING_API_URL: z.string().optional(),
	ONEROSTER_PROD_API_URL: z.string().optional(),
	ONEROSTER_API_URL: z.string().optional(),
	ONEROSTER_CLIENT_ID: z.string().optional(),
	ONEROSTER_CLIENT_SECRET: z.string().optional(),
	ONEROSTER_STAGING_CLIENT_ID: z.string().optional(),
	ONEROSTER_STAGING_CLIENT_SECRET: z.string().optional(),
	ONEROSTER_PRODUCTION_CLIENT_ID: z.string().optional(),
	ONEROSTER_PRODUCTION_CLIENT_SECRET: z.string().optional(),
	ONEROSTER_SCOPE: z.string().optional(),

	CALIPER_STAGING_API_URL: z.string().optional(),
	CALIPER_PROD_API_URL: z.string().optional(),
	CALIPER_API_URL: z.string().optional(),
	CALIPER_CLIENT_ID: z.string().optional(),
	CALIPER_CLIENT_SECRET: z.string().optional(),
	CALIPER_STAGING_CLIENT_ID: z.string().optional(),
	CALIPER_STAGING_CLIENT_SECRET: z.string().optional(),
	CALIPER_PRODUCTION_CLIENT_ID: z.string().optional(),
	CALIPER_PRODUCTION_CLIENT_SECRET: z.string().optional(),
	CALIPER_SCOPE: z.string().optional(),

	POWERPATH_STAGING_API_URL: z.string().optional(),
	POWERPATH_PROD_API_URL: z.string().optional(),
	POWERPATH_API_URL: z.string().optional(),
	POWERPATH_CLIENT_ID: z.string().optional(),
	POWERPATH_CLIENT_SECRET: z.string().optional(),
	POWERPATH_STAGING_CLIENT_ID: z.string().optional(),
	POWERPATH_STAGING_CLIENT_SECRET: z.string().optional(),
	POWERPATH_PRODUCTION_CLIENT_ID: z.string().optional(),
	POWERPATH_PRODUCTION_CLIENT_SECRET: z.string().optional(),
	POWERPATH_SCOPE: z.string().optional(),

	EDUBRIDGE_STAGING_API_URL: z.string().optional(),
	EDUBRIDGE_PROD_API_URL: z.string().optional(),
	EDUBRIDGE_API_URL: z.string().optional(),
	EDUBRIDGE_CLIENT_ID: z.string().optional(),
	EDUBRIDGE_CLIENT_SECRET: z.string().optional(),
	EDUBRIDGE_STAGING_CLIENT_ID: z.string().optional(),
	EDUBRIDGE_STAGING_CLIENT_SECRET: z.string().optional(),
	EDUBRIDGE_PRODUCTION_CLIENT_ID: z.string().optional(),
	EDUBRIDGE_PRODUCTION_CLIENT_SECRET: z.string().optional(),
	EDUBRIDGE_SCOPE: z.string().optional(),
});

export type RawTimebackEnv = z.infer<typeof RawEnvSchema>;

const GLOBAL_CLIENT_ID_KEYS: Record<TimebackEnvironment, keyof RawTimebackEnv> =
	{
		staging: "STAGING_CLIENT_ID",
		production: "PROD_CLIENT_ID",
	};

const GLOBAL_CLIENT_SECRET_KEYS: Record<
	TimebackEnvironment,
	keyof RawTimebackEnv
> = {
	staging: "STAGING_CLIENT_SECRET",
	production: "PROD_CLIENT_SECRET",
};

const GLOBAL_SCOPE_KEYS: Partial<
	Record<TimebackEnvironment, keyof RawTimebackEnv>
> = {
	staging: "STAGING_SCOPE",
	production: "PROD_SCOPE",
};

const GLOBAL_TOKEN_URL_KEYS: Partial<
	Record<TimebackEnvironment, keyof RawTimebackEnv>
> = {
	staging: "STAGING_AUTH_API",
	production: "PROD_AUTH_API",
};

const SERVICE_DEFINITIONS = {
	qti: {
		stagingUrlKey: "QTI_STAGING_API_URL",
		productionUrlKey: "QTI_PROD_API_URL",
		productionFallbackUrlKeys: ["QTI_API_URL"],
		clientIdKey: "QTI_CLIENT_ID",
		clientSecretKey: "QTI_CLIENT_SECRET",
		envClientId: {
			staging: "QTI_STAGING_CLIENT_ID",
			production: "QTI_PRODUCTION_CLIENT_ID",
		},
		envClientSecret: {
			staging: "QTI_STAGING_CLIENT_SECRET",
			production: "QTI_PRODUCTION_CLIENT_SECRET",
		},
		scopeKey: "QTI_SCOPE",
	},
	oneroster: {
		stagingUrlKey: "ONEROSTER_STAGING_API_URL",
		productionUrlKey: "ONEROSTER_PROD_API_URL",
		productionFallbackUrlKeys: ["ONEROSTER_API_URL"],
		clientIdKey: "ONEROSTER_CLIENT_ID",
		clientSecretKey: "ONEROSTER_CLIENT_SECRET",
		envClientId: {
			staging: "ONEROSTER_STAGING_CLIENT_ID",
			production: "ONEROSTER_PRODUCTION_CLIENT_ID",
		},
		envClientSecret: {
			staging: "ONEROSTER_STAGING_CLIENT_SECRET",
			production: "ONEROSTER_PRODUCTION_CLIENT_SECRET",
		},
		scopeKey: "ONEROSTER_SCOPE",
	},
	caliper: {
		stagingUrlKey: "CALIPER_STAGING_API_URL",
		productionUrlKey: "CALIPER_PROD_API_URL",
		productionFallbackUrlKeys: ["CALIPER_API_URL"],
		clientIdKey: "CALIPER_CLIENT_ID",
		clientSecretKey: "CALIPER_CLIENT_SECRET",
		envClientId: {
			staging: "CALIPER_STAGING_CLIENT_ID",
			production: "CALIPER_PRODUCTION_CLIENT_ID",
		},
		envClientSecret: {
			staging: "CALIPER_STAGING_CLIENT_SECRET",
			production: "CALIPER_PRODUCTION_CLIENT_SECRET",
		},
		scopeKey: "CALIPER_SCOPE",
	},
	powerpath: {
		stagingUrlKey: "POWERPATH_STAGING_API_URL",
		productionUrlKey: "POWERPATH_PROD_API_URL",
		productionFallbackUrlKeys: ["POWERPATH_API_URL"],
		clientIdKey: "POWERPATH_CLIENT_ID",
		clientSecretKey: "POWERPATH_CLIENT_SECRET",
		envClientId: {
			staging: "POWERPATH_STAGING_CLIENT_ID",
			production: "POWERPATH_PRODUCTION_CLIENT_ID",
		},
		envClientSecret: {
			staging: "POWERPATH_STAGING_CLIENT_SECRET",
			production: "POWERPATH_PRODUCTION_CLIENT_SECRET",
		},
		scopeKey: "POWERPATH_SCOPE",
	},
	edubridge: {
		stagingUrlKey: "EDUBRIDGE_STAGING_API_URL",
		productionUrlKey: "EDUBRIDGE_PROD_API_URL",
		productionFallbackUrlKeys: ["EDUBRIDGE_API_URL"],
		clientIdKey: "EDUBRIDGE_CLIENT_ID",
		clientSecretKey: "EDUBRIDGE_CLIENT_SECRET",
		envClientId: {
			staging: "EDUBRIDGE_STAGING_CLIENT_ID",
			production: "EDUBRIDGE_PRODUCTION_CLIENT_ID",
		},
		envClientSecret: {
			staging: "EDUBRIDGE_STAGING_CLIENT_SECRET",
			production: "EDUBRIDGE_PRODUCTION_CLIENT_SECRET",
		},
		scopeKey: "EDUBRIDGE_SCOPE",
	},
} satisfies Record<TimebackService, ServiceDefinition>;

type ServiceDefinition = {
	stagingUrlKey: keyof RawTimebackEnv;
	productionUrlKey: keyof RawTimebackEnv;
	stagingFallbackUrlKeys?: Array<keyof RawTimebackEnv>;
	productionFallbackUrlKeys?: Array<keyof RawTimebackEnv>;
	clientIdKey?: keyof RawTimebackEnv;
	clientSecretKey?: keyof RawTimebackEnv;
	envClientId?: Partial<Record<TimebackEnvironment, keyof RawTimebackEnv>>;
	envClientSecret?: Partial<Record<TimebackEnvironment, keyof RawTimebackEnv>>;
	scopeKey?: keyof RawTimebackEnv;
};

type ServiceCredentials = {
	clientId: string;
	clientSecret: string;
};

export type TimebackServiceConfig = {
	service: TimebackService;
	environment: TimebackEnvironment;
	baseUrl: string;
	tokenUrl: string;
	credentials?: ServiceCredentials;
	scope?: string;
};

type ServiceConfigOptions = {
	environment?: TimebackEnvironment;
	allowFallback?: boolean;
	requireCredentials?: boolean;
};

let envCache: RawTimebackEnv | null = null;

export function loadTimebackEnv(): RawTimebackEnv {
	if (!envCache) {
		envCache = RawEnvSchema.parse(process.env);
	}
	return envCache;
}

export function resetTimebackEnvCache(): void {
	envCache = null;
}

export function getTimebackServiceConfig(
	service: TimebackService,
	options: ServiceConfigOptions = {},
): TimebackServiceConfig {
	const env = loadTimebackEnv();
	const target = options.environment ?? inferDefaultEnvironment(env);
	const allowFallback = options.allowFallback ?? true;
	const requireCredentials = options.requireCredentials ?? true;
	const definition = SERVICE_DEFINITIONS[service];

	const candidates = allowFallback
		? target === "staging"
			? (["staging", "production"] as const)
			: (["production", "staging"] as const)
		: ([target] as const);

	for (const candidate of candidates) {
		const baseUrl = pickBaseUrl(env, definition, candidate);
		if (!baseUrl) {
			continue;
		}

		const credentials = pickCredentials(env, definition, candidate);
		if (!credentials) {
			if (requireCredentials) {
				continue;
			}

			return {
				service,
				environment: candidate,
				baseUrl,
				tokenUrl: pickTokenUrl(env, candidate),
				scope: pickScope(env, definition, candidate),
			};
		}

		return {
			service,
			environment: candidate,
			baseUrl,
			tokenUrl: pickTokenUrl(env, candidate),
			credentials,
			scope: pickScope(env, definition, candidate),
		};
	}

	throw new Error(
		`Missing configuration for TimeBack ${service} API in ${target} environment`,
	);
}

export function maybeGetTimebackServiceConfig(
	service: TimebackService,
	options: ServiceConfigOptions = {},
): TimebackServiceConfig | null {
	try {
		return getTimebackServiceConfig(service, options);
	} catch (_error) {
		return null;
	}
}

function inferDefaultEnvironment(env: RawTimebackEnv): TimebackEnvironment {
	const preference =
		pickValue(env, "TIMEBACK_ENVIRONMENT") ??
		pickValue(env, "TIMEBACK_ENV") ??
		pickValue(env, "TIMEBACK_DEFAULT_ENVIRONMENT");

	if (preference && isValidEnvironment(preference)) {
		return preference;
	}

	return "staging";
}

function pickBaseUrl(
	env: RawTimebackEnv,
	definition: ServiceDefinition,
	environment: TimebackEnvironment,
): string | null {
	const keys =
		environment === "staging"
			? [definition.stagingUrlKey, ...(definition.stagingFallbackUrlKeys ?? [])]
			: [
					definition.productionUrlKey,
					...(definition.productionFallbackUrlKeys ?? []),
				];

	for (const key of keys) {
		const value = pickValue(env, key);
		if (!value) {
			continue;
		}

		const normalized = normalizeBaseUrl(value);
		ensureValidUrl(normalized, String(key));
		return normalized;
	}

	return null;
}

function pickCredentials(
	env: RawTimebackEnv,
	definition: ServiceDefinition,
	environment: TimebackEnvironment,
): ServiceCredentials | null {
	const clientIdKey =
		definition.envClientId?.[environment] ?? definition.clientIdKey;
	const clientSecretKey =
		definition.envClientSecret?.[environment] ?? definition.clientSecretKey;

	let clientId = clientIdKey ? pickValue(env, clientIdKey) : null;
	let clientSecret = clientSecretKey ? pickValue(env, clientSecretKey) : null;

	if (!clientId) {
		const fallbackKey = GLOBAL_CLIENT_ID_KEYS[environment];
		clientId = pickValue(env, fallbackKey);
	}

	if (!clientSecret) {
		const fallbackKey = GLOBAL_CLIENT_SECRET_KEYS[environment];
		clientSecret = pickValue(env, fallbackKey);
	}

	if (!clientId || !clientSecret) {
		return null;
	}

	return {
		clientId,
		clientSecret,
	};
}

function pickTokenUrl(
	env: RawTimebackEnv,
	environment: TimebackEnvironment,
): string {
	const explicit =
		pickValue(
			env,
			environment === "staging"
				? "TIMEBACK_STAGING_TOKEN_URL"
				: "TIMEBACK_PRODUCTION_TOKEN_URL",
		) ?? pickValue(env, "TIMEBACK_TOKEN_URL");

	const fallbackAuthUrl = (() => {
		const key = GLOBAL_TOKEN_URL_KEYS[environment];
		return key ? pickValue(env, key) : null;
	})();

	const value =
		explicit ?? fallbackAuthUrl ?? DEFAULT_TOKEN_ENDPOINTS[environment];

	ensureValidUrl(value, `TimeBack ${environment} OAuth token endpoint`);
	return value;
}

function pickScope(
	env: RawTimebackEnv,
	definition: ServiceDefinition,
	environment: TimebackEnvironment,
): string | undefined {
	const specific = definition.scopeKey
		? pickValue(env, definition.scopeKey)
		: null;
	if (specific) {
		return specific;
	}

	const globalScope = pickValue(env, "TIMEBACK_SCOPE");
	if (globalScope) {
		return globalScope;
	}

	const environmentScopeKey = GLOBAL_SCOPE_KEYS[environment];
	if (environmentScopeKey) {
		const envScope = pickValue(env, environmentScopeKey);
		if (envScope) {
			return envScope;
		}
	}

	const fallback =
		environment === "production"
			? pickValue(env, "TIMEBACK_PRODUCTION_SCOPE")
			: pickValue(env, "TIMEBACK_STAGING_SCOPE");
	return fallback ?? undefined;
}

function normalizeBaseUrl(url: string): string {
	if (url.length === 0) {
		return url;
	}
	return url.replace(/\/+$/, "");
}

function pickValue(
	env: RawTimebackEnv,
	key: keyof RawTimebackEnv,
): string | null {
	const raw = env[key];
	if (typeof raw !== "string") {
		return null;
	}
	const trimmed = raw.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function isValidEnvironment(value: string): value is TimebackEnvironment {
	return value === "staging" || value === "production";
}

function ensureValidUrl(value: string, label: string): void {
	try {
		const parsed = new URL(value);
		if (!parsed.hostname) {
			throw new Error(`Invalid URL provided for ${label}`);
		}
	} catch (_error) {
		throw new Error(`Invalid URL provided for ${label}`);
	}
}
