import {
	type OperationCallArgs,
	type OperationResponse,
	callOperation,
	getOperationSpec,
} from "../http";
import type { CreateServiceClientOptions, ServiceClient } from "../internal";
import { createServiceClient } from "../internal";
import {
	type CaliperOperationAlias,
	type CaliperOperationSpecs,
	operationSpecs,
} from "./generated/operation-specs";

export type CaliperClient = ServiceClient & { service: "caliper" };
export type CreateCaliperClientOptions = CreateServiceClientOptions;
export type CaliperOperationArgs<
	Alias extends CaliperOperationAlias = CaliperOperationAlias,
> = OperationCallArgs<CaliperOperationSpecs, Alias>;

export function createCaliperClient(
	options: CreateCaliperClientOptions = {},
): CaliperClient {
	const client = createServiceClient("caliper", options);
	return client as CaliperClient;
}

export function getCaliperOperation<TAlias extends CaliperOperationAlias>(
	alias: TAlias,
) {
	return getOperationSpec(operationSpecs, alias);
}

export async function callCaliperOperation<
	TAlias extends CaliperOperationAlias,
>(
	client: CaliperClient,
	alias: TAlias,
	args: CaliperOperationArgs<TAlias>,
): Promise<OperationResponse<CaliperOperationSpecs, TAlias>> {
	return callOperation(client, operationSpecs, alias, args);
}
