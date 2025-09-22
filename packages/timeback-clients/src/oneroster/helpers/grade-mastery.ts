import type { OperationResponse } from "../../http";
import type { OneRosterClient, OneRosterOperationArgs } from "../client";
import { callOneRosterOperation } from "../client";
import type { OneRosterOperationSpecs } from "../generated/operation-specs";

type OneRosterOperations = OneRosterOperationSpecs;

const DEFAULT_LIMIT = 3000;
const DEFAULT_ACCURACY_THRESHOLD = 90;
const DEFAULT_GRADE_METADATA_KEY = "grades";

export type AssessmentLineItem = NonNullable<
	OperationResponse<OneRosterOperations, "getAllAssessmentLineItems">
>["assessmentLineItems"][number];

export type AssessmentResult = NonNullable<
	OperationResponse<OneRosterOperations, "getAllAssessmentResults">
>["assessmentResults"][number];

export type GradeMasteryCandidate = {
	grade: string;
	normalizedGrade: number | null;
	accuracy: number;
	assessmentLineItem: AssessmentLineItem;
	assessmentResult: AssessmentResult;
};

export type HighestGradeMasteryResult = {
	grade: string | null;
	accuracy?: number;
	assessmentLineItem?: AssessmentLineItem;
	assessmentResult?: AssessmentResult;
	candidates: GradeMasteryCandidate[];
};

export type HighestGradeMasteryParams = {
	client: OneRosterClient;
	studentSourcedId: string;
	subject?: string;
	accuracyThreshold?: number;
	gradeMetadataKey?: string;
	maxPageSize?: number;
	fetchAssessmentLineItems?: (
		client: OneRosterClient,
		filter: string | undefined,
		limit: number,
	) => Promise<AssessmentLineItem[]>;
	fetchAssessmentResult?: (
		client: OneRosterClient,
		assessmentLineItemSourcedId: string,
		studentSourcedId: string,
	) => Promise<AssessmentResult | null>;
};

export async function getHighestGradeMastery(
	params: HighestGradeMasteryParams,
): Promise<HighestGradeMasteryResult> {
	const {
		client,
		studentSourcedId,
		subject,
		accuracyThreshold = DEFAULT_ACCURACY_THRESHOLD,
		gradeMetadataKey = DEFAULT_GRADE_METADATA_KEY,
		maxPageSize = DEFAULT_LIMIT,
		fetchAssessmentLineItems: fetchLineItemsOverride,
		fetchAssessmentResult: fetchResultOverride,
	} = params;

	const assessmentLineItems = await (
		fetchLineItemsOverride ?? fetchAssessmentLineItems
	)(client, buildLineItemFilter(subject), maxPageSize);

	if (assessmentLineItems.length === 0) {
		return {
			grade: null,
			candidates: [],
		};
	}

	const candidates = (
		await Promise.all(
			assessmentLineItems.map(async (lineItem) => {
				const sourcedId = lineItem.sourcedId;
				if (!sourcedId) {
					return null;
				}

				const latestResult = await (
					fetchResultOverride ?? fetchLatestAssessmentResult
				)(client, sourcedId, studentSourcedId);

				if (!latestResult) {
					return null;
				}

				const accuracy = computeAccuracy(latestResult, lineItem);
				if (accuracy === null || accuracy < accuracyThreshold) {
					return null;
				}

				const grade = extractGrade(lineItem, gradeMetadataKey);
				if (!grade) {
					return null;
				}

				return {
					grade,
					normalizedGrade: normalizeGrade(grade),
					accuracy,
					assessmentLineItem: lineItem,
					assessmentResult: latestResult,
				} satisfies GradeMasteryCandidate;
			}),
		)
	).filter(
		(candidate): candidate is GradeMasteryCandidate => candidate !== null,
	);

	if (candidates.length === 0) {
		return {
			grade: null,
			candidates: [],
		};
	}

	const bestCandidate = selectTopCandidate(candidates);

	return {
		grade: bestCandidate.grade,
		accuracy: bestCandidate.accuracy,
		assessmentLineItem: bestCandidate.assessmentLineItem,
		assessmentResult: bestCandidate.assessmentResult,
		candidates: candidates.sort((left, right) => {
			const leftGrade = left.normalizedGrade ?? Number.NEGATIVE_INFINITY;
			const rightGrade = right.normalizedGrade ?? Number.NEGATIVE_INFINITY;
			if (leftGrade !== rightGrade) {
				return rightGrade - leftGrade;
			}
			if (left.accuracy !== right.accuracy) {
				return right.accuracy - left.accuracy;
			}
			const leftDate = Date.parse(left.assessmentResult.scoreDate);
			const rightDate = Date.parse(right.assessmentResult.scoreDate);
			return rightDate - leftDate;
		}),
	};
}

async function fetchAssessmentLineItems(
	client: OneRosterClient,
	filter: string | undefined,
	limit: number,
): Promise<AssessmentLineItem[]> {
	const items: AssessmentLineItem[] = [];
	let offset = 0;

	while (true) {
		const args: OneRosterOperationArgs<"getAllAssessmentLineItems"> = {
			query: {
				limit,
				offset,
				...(filter ? { filter } : {}),
			},
		};

		const response = await callOneRosterOperation(
			client,
			"getAllAssessmentLineItems",
			args,
		);

		const batch = response.assessmentLineItems ?? [];
		items.push(...batch);

		if (batch.length < limit) {
			break;
		}

		offset += batch.length;
	}

	return items;
}

async function fetchLatestAssessmentResult(
	client: OneRosterClient,
	assessmentLineItemSourcedId: string,
	studentSourcedId: string,
): Promise<AssessmentResult | null> {
	const filter = `assessmentLineItemSourcedId='${escapeFilterValue(assessmentLineItemSourcedId)}' AND studentSourcedId='${escapeFilterValue(studentSourcedId)}'`;

	const args: OneRosterOperationArgs<"getAllAssessmentResults"> = {
		query: {
			limit: 1,
			sort: "scoreDate",
			orderBy: "desc",
			filter,
		},
	};

	const response = await callOneRosterOperation(
		client,
		"getAllAssessmentResults",
		args,
	);

	const [latest] = response.assessmentResults ?? [];
	return latest ?? null;
}

function computeAccuracy(
	result: AssessmentResult,
	lineItem: AssessmentLineItem,
): number | null {
	const metadata = (result.metadata ?? {}) as Record<string, unknown>;
	const accuracyValue = metadata.accuracy;

	const parsedAccuracy = parseNumericValue(accuracyValue);
	if (parsedAccuracy !== null) {
		return parsedAccuracy;
	}

	const score = typeof result.score === "number" ? result.score : null;
	const maxValue =
		typeof lineItem.resultValueMax === "number"
			? lineItem.resultValueMax
			: parseNumericValue(lineItem.resultValueMax);

	if (score !== null && typeof maxValue === "number" && maxValue > 0) {
		return (score / maxValue) * 100;
	}

	return null;
}

function extractGrade(
	lineItem: AssessmentLineItem,
	gradeMetadataKey: string,
): string | null {
	const metadata = lineItem.metadata;
	if (!metadata || typeof metadata !== "object") {
		return null;
	}

	const value = (metadata as Record<string, unknown>)[gradeMetadataKey];
	if (Array.isArray(value) && value.length > 0) {
		const [first] = value;
		if (typeof first === "string" && first.length > 0) {
			return first;
		}
	}

	if (typeof value === "string" && value.length > 0) {
		return value;
	}

	const fallback = (metadata as Record<string, unknown>).grade;
	if (typeof fallback === "string" && fallback.length > 0) {
		return fallback;
	}

	if (typeof lineItem.title === "string") {
		const match = lineItem.title.match(/\b(\d{1,2})\b/);
		if (match?.[1]) {
			return match[1];
		}
	}

	return null;
}

function normalizeGrade(value: string): number | null {
	const match = value.match(/\d+/);
	if (!match) {
		return null;
	}
	const parsed = Number.parseInt(match[0] ?? "", 10);
	return Number.isNaN(parsed) ? null : parsed;
}

function parseNumericValue(value: unknown): number | null {
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

function selectTopCandidate(
	candidates: GradeMasteryCandidate[],
): GradeMasteryCandidate {
	return candidates.reduce((best, candidate) => {
		if (!best) {
			return candidate;
		}

		const bestGrade = best.normalizedGrade ?? Number.NEGATIVE_INFINITY;
		const candidateGrade =
			candidate.normalizedGrade ?? Number.NEGATIVE_INFINITY;

		if (candidateGrade > bestGrade) {
			return candidate;
		}
		if (candidateGrade < bestGrade) {
			return best;
		}

		if (candidate.accuracy > best.accuracy) {
			return candidate;
		}
		if (candidate.accuracy < best.accuracy) {
			return best;
		}

		const candidateDate = Date.parse(candidate.assessmentResult.scoreDate);
		const bestDate = Date.parse(best.assessmentResult.scoreDate);
		return candidateDate > bestDate ? candidate : best;
	});
}

function escapeFilterValue(value: string): string {
	return value.replace(/'/g, "\\'");
}

function buildLineItemFilter(subject: string | undefined): string | undefined {
	if (!subject) {
		return undefined;
	}
	return `metadata.subject~'${escapeFilterValue(subject)}'`;
}

export const __testing = {
	buildLineItemFilter,
	computeAccuracy,
	extractGrade,
	normalizeGrade,
	parseNumericValue,
	selectTopCandidate,
};
