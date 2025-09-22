import type { CreateServiceClientOptions, ServiceClient } from "../internal";
import { createServiceClient } from "../internal";

export type EdubridgeClient = ServiceClient & { service: "edubridge" };
export type CreateEdubridgeClientOptions = CreateServiceClientOptions;

export function createEdubridgeClient(
	options: CreateEdubridgeClientOptions = {},
): EdubridgeClient {
	const client = createServiceClient("edubridge", options);
	return client as EdubridgeClient;
}
