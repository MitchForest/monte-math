import type { TimebackServiceConfig } from "../env";

type FetchLike = (
	input: Parameters<typeof fetch>[0],
	init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

type OAuthTokenResponse = {
	access_token: string;
	expires_in?: number;
	token_type?: string;
};

type CachedToken = {
	accessToken: string;
	expiresAt: number;
};

type CreateOAuthClientOptions = {
	tokenUrl: string;
	clientId: string;
	clientSecret: string;
	scope?: string;
	fetcher?: FetchLike;
	clockSkewMs?: number;
};

export type OAuthClient = {
	getAccessToken: () => Promise<string>;
	invalidate: () => void;
};

const DEFAULT_CLOCK_SKEW_MS = 30_000;
const DEFAULT_EXPIRATION_SECONDS = 3600;

export function createOAuthClient(
	options: CreateOAuthClientOptions,
): OAuthClient {
	const fetcher: FetchLike =
		options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
	const clockSkew = options.clockSkewMs ?? DEFAULT_CLOCK_SKEW_MS;
	let cachedToken: CachedToken | null = null;
	let refreshPromise: Promise<string> | null = null;

	const getAccessToken = async () => {
		const now = Date.now();
		if (cachedToken && cachedToken.expiresAt > now + clockSkew) {
			return cachedToken.accessToken;
		}

		if (refreshPromise) {
			return refreshPromise;
		}

		refreshPromise = requestNewToken(fetcher, options).then((token) => {
			cachedToken = {
				accessToken: token.accessToken,
				expiresAt: token.expiresAt,
			};
			refreshPromise = null;
			return token.accessToken;
		});

		try {
			return await refreshPromise;
		} catch (error) {
			cachedToken = null;
			refreshPromise = null;
			throw error;
		}
	};

	const invalidate = () => {
		cachedToken = null;
	};

	return {
		getAccessToken,
		invalidate,
	};
}

export function createOAuthClientFromService(
	config: TimebackServiceConfig,
	overrides: Partial<CreateOAuthClientOptions> = {},
): OAuthClient {
	if (!config.credentials) {
		throw new Error(
			`Missing OAuth credentials for ${config.service} (${config.environment})`,
		);
	}

	return createOAuthClient({
		tokenUrl: config.tokenUrl,
		clientId: config.credentials.clientId,
		clientSecret: config.credentials.clientSecret,
		scope: config.scope,
		...overrides,
	});
}

async function requestNewToken(
	fetcher: FetchLike,
	options: CreateOAuthClientOptions,
): Promise<CachedToken> {
	const body = new URLSearchParams({
		grant_type: "client_credentials",
		client_id: options.clientId,
		client_secret: options.clientSecret,
	});

	if (options.scope) {
		body.set("scope", options.scope);
	}

	const response = await fetcher(options.tokenUrl, {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const text = await safeReadBody(response);
		throw new Error(
			`Failed to obtain TimeBack OAuth token (${response.status}): ${text}`,
		);
	}

	const payload = (await response.json()) as OAuthTokenResponse;
	if (!payload.access_token) {
		throw new Error("TimeBack OAuth token response is missing access_token");
	}

	const expiresIn =
		typeof payload.expires_in === "number" &&
		Number.isFinite(payload.expires_in)
			? payload.expires_in
			: DEFAULT_EXPIRATION_SECONDS;
	const expiresAt = Date.now() + expiresIn * 1000;

	return {
		accessToken: payload.access_token,
		expiresAt,
	};
}

async function safeReadBody(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch (_error) {
		return "<unreadable-response>";
	}
}
