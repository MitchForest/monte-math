import type { OAuthClient } from "../auth";
import type {
	TimebackEnvironment,
	TimebackService,
	TimebackServiceConfig,
} from "../env";

type FetchLike = (
	input: Parameters<typeof fetch>[0],
	init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

export type CreateTimebackFetchOptions = {
	config: TimebackServiceConfig;
	oauthClient: OAuthClient;
	fetcher?: FetchLike;
	defaultHeaders?: HeadersInit;
	retryOnUnauthorized?: boolean;
	userAgent?: string;
};

type ResolvedRequest = {
	url: string;
	init: RequestInit;
};

const AUTH_HEADER = "authorization";
const USER_AGENT_HEADER = "user-agent";

export function createTimebackFetch(
	options: CreateTimebackFetchOptions,
): FetchLike {
	const fetcher: FetchLike =
		options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
	const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
	const baseUrl = options.config.baseUrl;
	const service = options.config.service;
	const environment = options.config.environment;

	return async (input, init = {}) => {
		const accessToken = await options.oauthClient.getAccessToken();
		const resolved = prepareRequest(
			input,
			init,
			baseUrl,
			accessToken,
			options.defaultHeaders,
			options.userAgent,
		);

		let response = await fetcher(resolved.url, resolved.init);
		if (response.status === 401 && retryOnUnauthorized) {
			options.oauthClient.invalidate();
			const retryToken = await options.oauthClient.getAccessToken();
			const retryRequest = prepareRequest(
				input,
				init,
				baseUrl,
				retryToken,
				options.defaultHeaders,
				options.userAgent,
			);
			response = await fetcher(retryRequest.url, retryRequest.init);
		}

		annotateResponse(response, service, environment);
		return response;
	};
}

function prepareRequest(
	input: Parameters<FetchLike>[0],
	init: RequestInit,
	baseUrl: string,
	accessToken: string,
	defaultHeaders?: HeadersInit,
	userAgent?: string,
): ResolvedRequest {
	if (input instanceof Request) {
		return buildFromRequest(
			input,
			init,
			baseUrl,
			accessToken,
			defaultHeaders,
			userAgent,
		);
	}

	const url = resolveUrl(input, baseUrl);
	const headers = mergeHeaders(defaultHeaders, init.headers);
	if (!headers.has(AUTH_HEADER)) {
		headers.set(AUTH_HEADER, `Bearer ${accessToken}`);
	}

	if (userAgent && !headers.has(USER_AGENT_HEADER)) {
		headers.set(USER_AGENT_HEADER, userAgent);
	}

	const finalInit: RequestInit = {
		...init,
		headers,
	};

	return { url, init: finalInit };
}

function buildFromRequest(
	request: Request,
	init: RequestInit,
	baseUrl: string,
	accessToken: string,
	defaultHeaders?: HeadersInit,
	userAgent?: string,
): ResolvedRequest {
	const cloned = request.clone();
	const headers = mergeHeaders(defaultHeaders, cloned.headers, init.headers);

	if (!headers.has(AUTH_HEADER)) {
		headers.set(AUTH_HEADER, `Bearer ${accessToken}`);
	}

	if (userAgent && !headers.has(USER_AGENT_HEADER)) {
		headers.set(USER_AGENT_HEADER, userAgent);
	}

	const url = resolveUrl(cloned.url, baseUrl);
	const finalInit: RequestInit = {
		method: init.method ?? cloned.method,
		headers,
		body: init.body ?? cloned.body ?? undefined,
		cache: init.cache ?? cloned.cache,
		credentials: init.credentials ?? cloned.credentials,
		integrity: init.integrity ?? cloned.integrity,
		keepalive: init.keepalive ?? cloned.keepalive,
		mode: init.mode ?? cloned.mode,
		redirect: init.redirect ?? cloned.redirect,
		referrer: init.referrer ?? cloned.referrer,
		referrerPolicy: init.referrerPolicy ?? cloned.referrerPolicy,
		signal: init.signal ?? cloned.signal,
	};

	return { url, init: finalInit };
}

function resolveUrl(input: Parameters<FetchLike>[0], baseUrl: string): string {
	if (typeof input === "string") {
		return isAbsoluteUrl(input) ? input : joinUrl(baseUrl, input);
	}

	if (input instanceof URL) {
		return input.toString();
	}

	if (input instanceof Request) {
		return resolveUrl(input.url, baseUrl);
	}

	throw new Error("Unsupported fetch input type for TimeBack client");
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
	const target = new Headers();
	for (const source of sources) {
		if (!source) {
			continue;
		}
		const incoming = new Headers(source);
		incoming.forEach((value, key) => {
			target.set(key, value);
		});
	}
	return target;
}

function joinUrl(baseUrl: string, path: string): string {
	if (isAbsoluteUrl(path)) {
		return path;
	}

	const normalizedBase = baseUrl.replace(/\/+$/, "");
	const normalizedPath = path.replace(/^\/+/, "");
	return `${normalizedBase}/${normalizedPath}`;
}

function isAbsoluteUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return Boolean(parsed.protocol && parsed.hostname);
	} catch (_error) {
		return false;
	}
}

function annotateResponse(
	response: Response,
	service: TimebackService,
	environment: TimebackEnvironment,
): void {
	Reflect.set(response, "timebackService", service);
	Reflect.set(response, "timebackEnvironment", environment);
}
