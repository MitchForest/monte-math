import {
	type OperationByAlias,
	type OperationCallArgs,
	type OperationResponse,
	callOperation,
	getOperationSpec,
} from "../http";
import type { CreateServiceClientOptions, ServiceClient } from "../internal";
import { createServiceClient } from "../internal";
import {
	type PowerpathOperationAlias,
	type PowerpathOperationSpecs,
	operationSpecs,
} from "./generated/operation-specs";

export type PowerpathClient = ServiceClient & { service: "powerpath" };
export type CreatePowerpathClientOptions = CreateServiceClientOptions;
export type PowerpathOperationArgs<
	Alias extends PowerpathOperationAlias = PowerpathOperationAlias,
> = OperationCallArgs<PowerpathOperationSpecs, Alias>;

export function createPowerpathClient(
	options: CreatePowerpathClientOptions = {},
): PowerpathClient {
	const client = createServiceClient("powerpath", options);
	return client as PowerpathClient;
}

export function getPowerpathOperation<TAlias extends PowerpathOperationAlias>(
	alias: TAlias,
): OperationByAlias<PowerpathOperationSpecs, TAlias> | undefined {
	return getOperationSpec(operationSpecs, alias);
}

export async function callPowerpathOperation<
	TAlias extends PowerpathOperationAlias,
>(
	client: PowerpathClient,
	alias: TAlias,
	args: PowerpathOperationArgs<TAlias>,
): Promise<OperationResponse<PowerpathOperationSpecs, TAlias>> {
	return callOperation(client, operationSpecs, alias, args);
}
