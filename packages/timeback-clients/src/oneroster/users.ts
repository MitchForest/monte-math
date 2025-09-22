import type { z } from "zod";
import type { OperationByAlias } from "../http";
import { type OneRosterClient, callOneRosterOperation } from "./client";
import type { OneRosterOperationSpecs } from "./generated/operation-specs";

type GetAllUsersOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAllUsers"
>;

type GetUserOperation = OperationByAlias<OneRosterOperationSpecs, "getUser">;

type GetUserWithDemographicsOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getUserWithDemographics"
>;

type GetAgentsOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAgents"
>;

type GetAgentForOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAgentFor"
>;

export type OneRosterUserList = z.infer<GetAllUsersOperation["response"]>;
export type OneRosterUser = OneRosterUserList["users"][number];
export type OneRosterUserDetail = z.infer<GetUserOperation["response"]>;
export type OneRosterUserWithDemographics = z.infer<
	GetUserWithDemographicsOperation["response"]
>;
export type OneRosterAgentList = z.infer<GetAgentsOperation["response"]>;
export type OneRosterAgentForList = z.infer<GetAgentForOperation["response"]>;

export type ListUsersParams = {
	limit?: number;
	offset?: number;
	search?: string;
	sort?: string;
	orderBy?: "asc" | "desc";
	fields?: string;
	filter?: string;
};

export type GetUserParams = {
	fields?: string;
};

const GET_ALL_USERS_ALIAS: GetAllUsersOperation["alias"] = "getAllUsers";
const GET_USER_ALIAS: GetUserOperation["alias"] = "getUser";
const GET_USER_WITH_DEMOGRAPHICS_ALIAS: GetUserWithDemographicsOperation["alias"] =
	"getUserWithDemographics";
const GET_AGENTS_ALIAS: GetAgentsOperation["alias"] = "getAgents";
const GET_AGENT_FOR_ALIAS: GetAgentForOperation["alias"] = "getAgentFor";

export async function listUsers(
	client: OneRosterClient,
	params: ListUsersParams = {},
): Promise<OneRosterUserList> {
	return callOneRosterOperation(client, GET_ALL_USERS_ALIAS, {
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

export async function getUser(
	client: OneRosterClient,
	userSourcedId: string,
	params: GetUserParams = {},
): Promise<OneRosterUserDetail> {
	return callOneRosterOperation(client, GET_USER_ALIAS, {
		path: { sourcedId: userSourcedId },
		query: {
			fields: params.fields,
		},
	});
}

export async function getUserWithDemographics(
	client: OneRosterClient,
	userSourcedId: string,
	params: GetUserParams = {},
): Promise<OneRosterUserWithDemographics> {
	return callOneRosterOperation(client, GET_USER_WITH_DEMOGRAPHICS_ALIAS, {
		path: { sourcedId: userSourcedId },
		query: {
			fields: params.fields,
		},
	});
}

export async function listAgentsForUser(
	client: OneRosterClient,
	userSourcedId: string,
): Promise<OneRosterAgentList> {
	return callOneRosterOperation(client, GET_AGENTS_ALIAS, {
		path: { userId: userSourcedId },
	});
}

export async function listUsersForAgent(
	client: OneRosterClient,
	userSourcedId: string,
): Promise<OneRosterAgentForList> {
	return callOneRosterOperation(client, GET_AGENT_FOR_ALIAS, {
		path: { userId: userSourcedId },
	});
}
