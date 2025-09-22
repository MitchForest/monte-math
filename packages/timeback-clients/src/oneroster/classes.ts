import type { z } from "zod";
import type { OperationByAlias } from "../http";
import { type OneRosterClient, callOneRosterOperation } from "./client";
import type { OneRosterOperationSpecs } from "./generated/operation-specs";

type GetAllClassesOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAllClasses"
>;

type GetClassOperation = OperationByAlias<OneRosterOperationSpecs, "getClass">;

export type OneRosterClassList = z.infer<GetAllClassesOperation["response"]>;
export type OneRosterClass = OneRosterClassList["classes"][number];
export type OneRosterClassDetail = z.infer<GetClassOperation["response"]>;

export type ListClassesParams = {
	limit?: number;
	offset?: number;
	search?: string;
	sort?: string;
	orderBy?: "asc" | "desc";
	fields?: string;
	filter?: string;
};

export type GetClassParams = {
	fields?: string;
};

const GET_ALL_CLASSES_ALIAS: GetAllClassesOperation["alias"] = "getAllClasses";
const GET_CLASS_ALIAS: GetClassOperation["alias"] = "getClass";

export async function listClasses(
	client: OneRosterClient,
	params: ListClassesParams = {},
): Promise<OneRosterClassList> {
	return callOneRosterOperation(client, GET_ALL_CLASSES_ALIAS, {
		query: {
			limit: params.limit,
			offset: params.offset,
			search: params.search,
			sort: params.sort,
			orderBy: params.orderBy,
			fields: params.fields,
			filter: params.filter,
		},
	});
}

export async function getClass(
	client: OneRosterClient,
	classSourcedId: string,
	params: GetClassParams = {},
): Promise<OneRosterClassDetail> {
	return callOneRosterOperation(client, GET_CLASS_ALIAS, {
		path: { sourcedId: classSourcedId },
		query: {
			fields: params.fields,
		},
	});
}
