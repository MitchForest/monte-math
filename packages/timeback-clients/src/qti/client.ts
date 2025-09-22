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
	type QtiOperationAlias,
	type QtiOperationSpecs,
	operationSpecs,
} from "./generated/operation-specs";

export type QtiClient = ServiceClient & { service: "qti" };
export type CreateQtiClientOptions = CreateServiceClientOptions;
export type QtiOperationArgs<
	Alias extends QtiOperationAlias = QtiOperationAlias,
> = OperationCallArgs<QtiOperationSpecs, Alias>;

export function createQtiClient(
	options: CreateQtiClientOptions = {},
): QtiClient {
	const client = createServiceClient("qti", options);
	return client as QtiClient;
}

export function getQtiOperation<TAlias extends QtiOperationAlias>(
	alias: TAlias,
): OperationByAlias<QtiOperationSpecs, TAlias> | undefined {
	return getOperationSpec(operationSpecs, alias);
}

export async function callQtiOperation<TAlias extends QtiOperationAlias>(
	client: QtiClient,
	alias: TAlias,
	args: QtiOperationArgs<TAlias>,
): Promise<OperationResponse<QtiOperationSpecs, TAlias>> {
	return callOperation(client, operationSpecs, alias, args);
}
