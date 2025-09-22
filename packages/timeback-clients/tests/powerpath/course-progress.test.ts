import { describe, expect, it } from "bun:test";

import type { OperationResponse } from "../../src/http";
import type { PowerpathOperationSpecs } from "../../src/powerpath/generated/operation-specs";
import {
	type CourseProgressLineItem,
	__testing,
	getCourseProgressSummary,
} from "../../src/powerpath/helpers/course-progress";

const testClient = {} as import("../../src/powerpath/client").PowerpathClient;

describe("getCourseProgressSummary", () => {
	it("computes summary metrics and aggregates XP", async () => {
		const response: OperationResponse<
			PowerpathOperationSpecs,
			"getCourseProgress"
		> = {
			lineItems: [
				createLineItem("ali-1", "component-1", [
					createResult({ metadata: { xp: 25 } }),
				]),
				createLineItem("ali-2", "component-2", []),
				createLineItem("ali-3", "component-3", [
					createResult({ metadata: { xp: "15" } }),
				]),
			],
		};

		const summary = await getCourseProgressSummary({
			client: testClient,
			courseId: "course-1",
			studentId: "student-1",
			fetchCourseProgress: async () => response,
		});

		expect(summary.totalLineItems).toBe(3);
		expect(summary.completedLineItems).toBe(2);
		expect(summary.outstandingLineItems).toBe(1);
		expect(summary.totalXpAwarded).toBe(40);
		expect(summary.completionRate).toBeCloseTo(2 / 3);
		expect(summary.lineItems).toHaveLength(3);
	});
});

describe("course progress helpers", () => {
	it("parses XP from numeric and string values", () => {
		expect(__testing.parseXp(10)).toBe(10);
		expect(__testing.parseXp("12.5")).toBeCloseTo(12.5);
		expect(__testing.parseXp(null)).toBeNull();
	});
});

function createLineItem(
	assessmentLineItemSourcedId: string,
	courseComponentSourcedId: string,
	results: Array<CourseProgressLineItem["results"][number]>,
): CourseProgressLineItem {
	return {
		type: "resource",
		assessmentLineItemSourcedId,
		courseComponentSourcedId,
		title: `Lesson ${assessmentLineItemSourcedId}`,
		results,
	} as CourseProgressLineItem;
}

function createResult(
	overrides: Partial<CourseProgressLineItem["results"][number]> = {},
): CourseProgressLineItem["results"][number] {
	return {
		sourcedId: undefined,
		status: "active",
		dateLastModified: undefined,
		metadata: overrides.metadata ?? {},
		assessmentLineItem: {
			sourcedId: "ali",
		} as CourseProgressLineItem["results"][number]["assessmentLineItem"],
		student: {
			sourcedId: "student-1",
		} as CourseProgressLineItem["results"][number]["student"],
		score: null,
		textScore: null,
		scoreDate:
			overrides.scoreDate ?? new Date("2024-08-01T00:00:00Z").toISOString(),
		scoreScale: null,
		scorePercentile: null,
		scoreStatus: "submitted",
		comment: null,
		learningObjectiveSet: null,
		inProgress: null,
		incomplete: null,
		late: null,
		missing: null,
		...overrides,
	} as CourseProgressLineItem["results"][number];
}
