import type { OAuthClient } from "../auth";
import { createOAuthClientFromService } from "../auth";
import {
	type TimebackEnvironment,
	type TimebackService,
	type TimebackServiceConfig,
	getTimebackServiceConfig,
} from "../env";
import type { CreateTimebackFetchOptions } from "../http";
import { createTimebackFetch } from "../http";

type FetchLike = (
	input: Parameters<typeof fetch>[0],
	init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

export type CreateServiceClientOptions = {
	environment?: TimebackEnvironment;
	fetcher?: FetchLike;
	defaultHeaders?: HeadersInit;
	userAgent?: string;
};

export type ServiceClient = {
	service: TimebackService;
	environment: TimebackEnvironment;
	baseUrl: string;
	fetch: FetchLike;
	oauthClient: OAuthClient;
	config: TimebackServiceConfig;
};

export function createServiceClient(
	service: TimebackService,
	options: CreateServiceClientOptions = {},
): ServiceClient {
	const config = getTimebackServiceConfig(service, {
		environment: options.environment,
	});
	const oauthClient = createOAuthClientFromService(config, {
		fetcher: options.fetcher,
	});

	const fetchOptions: CreateTimebackFetchOptions = {
		config,
		oauthClient,
		fetcher: options.fetcher,
		defaultHeaders: options.defaultHeaders,
		userAgent: options.userAgent,
	};

	const authorizedFetch = createTimebackFetch(fetchOptions);

	return {
		service,
		environment: config.environment,
		baseUrl: config.baseUrl,
		fetch: authorizedFetch,
		oauthClient,
		config,
	};
}
