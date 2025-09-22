import type { z } from "zod";
import type { OperationByAlias } from "../http";
import { type OneRosterClient, callOneRosterOperation } from "./client";
import type { OneRosterOperationSpecs } from "./generated/operation-specs";

type GetAllCoursesOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getAllCourses"
>;

type GetCourseOperation = OperationByAlias<
	OneRosterOperationSpecs,
	"getCourse"
>;

export type OneRosterCourseList = z.infer<GetAllCoursesOperation["response"]>;
export type OneRosterCourse = OneRosterCourseList["courses"][number];
export type OneRosterCourseDetail = z.infer<GetCourseOperation["response"]>;

export type ListCoursesParams = {
	limit?: number;
	offset?: number;
	search?: string;
	sort?: string;
	orderBy?: "asc" | "desc";
	fields?: string;
	filter?: string;
};

export type GetCourseParams = {
	fields?: string;
};

const GET_ALL_COURSES_ALIAS: GetAllCoursesOperation["alias"] = "getAllCourses";
const GET_COURSE_ALIAS: GetCourseOperation["alias"] = "getCourse";

export async function listCourses(
	client: OneRosterClient,
	params: ListCoursesParams = {},
): Promise<OneRosterCourseList> {
	return callOneRosterOperation(client, GET_ALL_COURSES_ALIAS, {
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

export async function getCourse(
	client: OneRosterClient,
	courseSourcedId: string,
	params: GetCourseParams = {},
): Promise<OneRosterCourseDetail> {
	return callOneRosterOperation(client, GET_COURSE_ALIAS, {
		path: { sourcedId: courseSourcedId },
		query: {
			fields: params.fields,
		},
	});
}
