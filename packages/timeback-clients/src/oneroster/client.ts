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
	type OneRosterOperationAlias,
	type OneRosterOperationSpecs,
	operationSpecs,
} from "./generated/operation-specs";

export type OneRosterClient = ServiceClient & { service: "oneroster" };
export type CreateOneRosterClientOptions = CreateServiceClientOptions;
export type OneRosterOperationArgs<
	Alias extends OneRosterOperationAlias = OneRosterOperationAlias,
> = OperationCallArgs<OneRosterOperationSpecs, Alias>;

export function createOneRosterClient(
	options: CreateOneRosterClientOptions = {},
): OneRosterClient {
	const client = createServiceClient("oneroster", options);
	return client as OneRosterClient;
}

export function getOneRosterOperation<TAlias extends OneRosterOperationAlias>(
	alias: TAlias,
): OperationByAlias<OneRosterOperationSpecs, TAlias> | undefined {
	return getOperationSpec(operationSpecs, alias);
}

export async function callOneRosterOperation<
	TAlias extends OneRosterOperationAlias,
>(
	client: OneRosterClient,
	alias: TAlias,
	args: OneRosterOperationArgs<TAlias>,
): Promise<OperationResponse<OneRosterOperationSpecs, TAlias>> {
	return callOperation(client, operationSpecs, alias, args);
}
