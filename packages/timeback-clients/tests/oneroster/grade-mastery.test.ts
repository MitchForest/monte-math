import { describe, expect, it } from "bun:test";

import type {
	AssessmentLineItem,
	AssessmentResult,
} from "../../src/oneroster/helpers/grade-mastery";
import {
	__testing,
	getHighestGradeMastery,
} from "../../src/oneroster/helpers/grade-mastery";

const testClient = {} as import("../../src/oneroster/client").OneRosterClient;

describe("getHighestGradeMastery", () => {
	it("returns the highest mastered grade by normalized grade and accuracy", async () => {
		const lineItems: AssessmentLineItem[] = [
			createLineItem("line-grade-05", { subject: "Math", grades: ["05"] }),
			createLineItem("line-grade-04", { subject: "Math", grades: ["04"] }),
			createLineItem("line-grade-03", { subject: "Math", grades: ["03"] }),
		];

		const results = new Map<string, AssessmentResult>([
			[
				"line-grade-05",
				createResult("line-grade-05", {
					scoreDate: new Date("2024-09-01T00:00:00Z").toISOString(),
					metadata: { accuracy: 96 },
				}),
			],
			[
				"line-grade-04",
				createResult("line-grade-04", {
					scoreDate: new Date("2024-08-01T00:00:00Z").toISOString(),
					metadata: { accuracy: 88 },
				}),
			],
			[
				"line-grade-03",
				createResult("line-grade-03", {
					scoreDate: new Date("2024-07-01T00:00:00Z").toISOString(),
					score: 45,
					metadata: {},
				}),
			],
		]);

		const summary = await getHighestGradeMastery({
			client: testClient,
			studentSourcedId: "student-123",
			subject: "Math",
			fetchAssessmentLineItems: async () => lineItems,
			fetchAssessmentResult: async (_client, lineItemId) =>
				results.get(lineItemId) ?? null,
		});

		expect(summary.grade).toBe("05");
		expect(summary.candidates.length).toBe(1);
		expect(summary.candidates[0]?.accuracy).toBe(96);
	});
});

describe("grade mastery helpers", () => {
	it("computes accuracy from metadata and score fallback", () => {
		const lineItem = createLineItem("line", {}, 50);

		const resultWithMetadata = createResult("line", {
			metadata: { accuracy: 91 },
		});

		expect(__testing.computeAccuracy(resultWithMetadata, lineItem)).toBeCloseTo(
			91,
		);

		const resultWithScore = createResult("line", {
			score: 40,
			metadata: {},
		});

		expect(__testing.computeAccuracy(resultWithScore, lineItem)).toBeCloseTo(
			80,
		);
	});

	it("normalizes grades and escapes filters", () => {
		expect(__testing.normalizeGrade("05")).toBe(5);
		expect(__testing.normalizeGrade("Grade 7")).toBe(7);
		expect(__testing.buildLineItemFilter("Science & Humanities")).toBe(
			"metadata.subject~'Science & Humanities'",
		);
	});
});

function createLineItem(
	id: string,
	metadata: Record<string, unknown>,
	resultValueMax: number | null = null,
): AssessmentLineItem {
	return {
		sourcedId: id,
		status: "active",
		title: `Line Item ${id}`,
		metadata,
		resultValueMax,
	} as AssessmentLineItem;
}

function createResult(
	lineItemId: string,
	overrides: Partial<AssessmentResult> = {},
): AssessmentResult {
	return {
		status: "active",
		assessmentLineItem: { sourcedId: lineItemId } as AssessmentLineItem,
		student: { sourcedId: "student-123" } as AssessmentResult["student"],
		scoreDate: new Date().toISOString(),
		scoreStatus: "submitted",
		metadata: {},
		score: null,
		textScore: null,
		scoreScale: null,
		scorePercentile: null,
		comment: null,
		learningObjectiveSet: null,
		inProgress: null,
		incomplete: null,
		late: null,
		missing: null,
		...overrides,
	} as AssessmentResult;
}
