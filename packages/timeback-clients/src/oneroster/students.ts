import type { z } from "zod";
import type { OperationByAlias } from "../http";
import { type OneRosterClient, callOneRosterOperation } from "./client";
import type { OneRosterOperationSpecs } from "./generated/operation-specs";

type GetAllStudentsOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAllStudents"
>;

type GetStudentsForClassOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getStudentsForClass"
>;

type GetStudentOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getStudent"
>;

export type OneRosterStudent = z.infer<
	GetAllStudentsOperation["response"]
>["users"][number];

export type OneRosterStudentList = z.infer<GetAllStudentsOperation["response"]>;

export type OneRosterClassStudentList = z.infer<
	GetStudentsForClassOperation["response"]
>;

export type OneRosterStudentDetail = z.infer<GetStudentOperation["response"]>;

export type ListStudentsParams = {
	limit?: number;
	offset?: number;
	search?: string;
	sort?: string;
	orderBy?: "asc" | "desc";
	fields?: string;
	filter?: string;
};

export type ListClassStudentsParams = ListStudentsParams & {
	classSourcedId: string;
};

const DEFAULT_LIMIT = 200;
const GET_ALL_STUDENTS_ALIAS: GetAllStudentsOperation["alias"] =
	"getAllStudents";
const GET_CLASS_STUDENTS_ALIAS: GetStudentsForClassOperation["alias"] =
	"getStudentsForClass";
const GET_STUDENT_ALIAS: GetStudentOperation["alias"] = "getStudent";

export async function listStudents(
	client: OneRosterClient,
	params: ListStudentsParams = {},
): Promise<OneRosterStudentList> {
	return callOneRosterOperation(client, GET_ALL_STUDENTS_ALIAS, {
		query: {
			limit: params.limit ?? DEFAULT_LIMIT,
			offset: params.offset,
			search: params.search,
			sort: params.sort,
			orderBy: params.orderBy,
			fields: params.fields,
			filter: params.filter,
		},
	});
}

export async function listClassStudents(
	client: OneRosterClient,
	params: ListClassStudentsParams,
): Promise<OneRosterClassStudentList> {
	return callOneRosterOperation(client, GET_CLASS_STUDENTS_ALIAS, {
		path: { classSourcedId: params.classSourcedId },
		query: {
			limit: params.limit ?? DEFAULT_LIMIT,
			offset: params.offset,
			search: params.search,
			sort: params.sort,
			orderBy: params.orderBy,
			fields: params.fields,
			filter: params.filter,
		},
	});
}

export async function getStudent(
	client: OneRosterClient,
	sourcedId: string,
): Promise<OneRosterStudentDetail> {
	return callOneRosterOperation(client, GET_STUDENT_ALIAS, {
		path: { sourcedId },
	});
}
