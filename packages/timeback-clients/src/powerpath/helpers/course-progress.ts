import type { OperationResponse } from "../../http";
import type { PowerpathClient, PowerpathOperationArgs } from "../client";
import { callPowerpathOperation } from "../client";
import type { PowerpathOperationSpecs } from "../generated/operation-specs";

type PowerpathOperations = PowerpathOperationSpecs;

type GetCourseProgressResponse = OperationResponse<
	PowerpathOperations,
	"getCourseProgress"
>;

export type CourseProgressLineItem =
	GetCourseProgressResponse["lineItems"][number];

type CourseProgressOperationArgs = PowerpathOperationArgs<"getCourseProgress">;

export type CourseProgressSummary = {
	totalLineItems: number;
	completedLineItems: number;
	outstandingLineItems: number;
	completionRate: number;
	totalXpAwarded: number;
	lineItems: CourseProgressLineItem[];
};

export type CourseProgressParams = {
	client: PowerpathClient;
	courseId: string;
	studentId: string;
	lessonId?: string;
	fetchCourseProgress?: (
		client: PowerpathClient,
		args: CourseProgressOperationArgs,
	) => Promise<GetCourseProgressResponse>;
};

export async function getCourseProgressSummary(
	params: CourseProgressParams,
): Promise<CourseProgressSummary> {
	const { client, courseId, studentId, lessonId } = params;

	const args: CourseProgressOperationArgs = {
		path: {
			courseId,
			studentId,
		},
		query: lessonId ? { lessonId } : undefined,
	};

	const fetcher = params.fetchCourseProgress
		? params.fetchCourseProgress
		: (innerClient: PowerpathClient, innerArgs: CourseProgressOperationArgs) =>
				callPowerpathOperation(innerClient, "getCourseProgress", innerArgs);

	const response = await fetcher(client, args);

	const lineItems = response.lineItems ?? [];
	const summary = summarizeCourseProgress(lineItems);

	return {
		...summary,
		lineItems,
	};
}

function summarizeCourseProgress(lineItems: CourseProgressLineItem[]) {
	const totalLineItems = lineItems.length;

	let completedLineItems = 0;
	let totalXpAwarded = 0;

	for (const lineItem of lineItems) {
		const results = lineItem.results ?? [];
		if (results.length > 0) {
			completedLineItems += 1;
		}

		for (const result of results) {
			const metadata = result.metadata;
			if (!metadata || typeof metadata !== "object") {
				continue;
			}
			const xpValue = (metadata as Record<string, unknown>).xp;
			const xp = parseXp(xpValue);
			if (xp !== null) {
				totalXpAwarded += xp;
			}
		}
	}

	const outstandingLineItems = Math.max(totalLineItems - completedLineItems, 0);
	const completionRate =
		totalLineItems === 0 ? 0 : completedLineItems / totalLineItems;

	return {
		totalLineItems,
		completedLineItems,
		outstandingLineItems,
		completionRate,
		totalXpAwarded,
	} satisfies Omit<CourseProgressSummary, "lineItems">;
}

function parseXp(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return null;
}

export const __testing = {
	parseXp,
	summarizeCourseProgress,
};
