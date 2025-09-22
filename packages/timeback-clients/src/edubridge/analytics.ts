import { ZodError, z } from "zod";

import { TimebackClientError } from "../http";
import type { OperationSpec } from "../types";
import type { EdubridgeClient } from "./client";

const buildQuery = (params: Record<string, string | undefined>): string => {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) {
			continue;
		}
		search.set(key, value);
	}
	const query = search.toString();
	return query.length > 0 ? `?${query}` : "";
};

const readJson = async (response: Response): Promise<unknown> => {
	try {
		return await response.json();
	} catch {
		return null;
	}
};

const wrapValidationError = (
	client: EdubridgeClient,
	operation: OperationSpec,
	error: ZodError,
	parameter?: string,
): TimebackClientError => {
	const firstIssue = error.issues.at(0);
	const location = "query";
	const parameterName =
		parameter ??
		(typeof firstIssue?.path?.[0] === "string" ? firstIssue.path[0] : "query");
	return TimebackClientError.requestValidation({
		service: client.service,
		environment: client.environment,
		operation,
		location,
		parameter: parameterName,
		issues: error.issues,
	});
};

const ActivityFactsParamsSchema = z
	.object({
		studentId: z.string().min(1).optional(),
		email: z.string().email().optional(),
		startDate: z.string().min(1),
		endDate: z.string().min(1),
		timezone: z.string().optional(),
	})
	.refine((value) => value.studentId || value.email, {
		message: "studentId or email is required",
		path: ["studentId"],
	});

const WeeklyFactsParamsSchema = z
	.object({
		studentId: z.string().min(1).optional(),
		email: z.string().email().optional(),
		startDate: z.string().min(1).optional(),
		endDate: z.string().min(1).optional(),
		timezone: z.string().optional(),
	})
	.refine((value) => value.studentId || value.email, {
		message: "studentId or email is required",
		path: ["studentId"],
	});

const HighestGradeParamsSchema = z.object({
	studentId: z.string().min(1),
	subject: z.string().min(1),
});

const TimeSavedParamsSchema = z.object({
	studentId: z.string().min(1),
});

const ActivityMetricsSchema = z.object({
	xpEarned: z.number().optional(),
	totalQuestions: z.number().optional(),
	correctQuestions: z.number().optional(),
	masteredUnits: z.number().optional(),
});

const TimeSpentMetricsSchema = z.object({
	activeSeconds: z.number().optional(),
	inactiveSeconds: z.number().optional(),
	wasteSeconds: z.number().optional(),
});

const ActivityFactsBucketSchema = z.object({
	activityMetrics: ActivityMetricsSchema.optional(),
	timeSpentMetrics: TimeSpentMetricsSchema.optional(),
	apps: z.array(z.string()).optional(),
});

const ActivityFactsResponseSchema = z.object({
	message: z.string(),
	startDate: z.string(),
	endDate: z.string(),
	facts: z
		.record(z.string(), z.record(z.string(), ActivityFactsBucketSchema))
		.optional(),
	factsByApp: z
		.record(
			z.string(),
			z.record(z.string(), z.record(z.string(), ActivityFactsBucketSchema)),
		)
		.optional(),
});

const WeeklyFactSchema = z.object({
	id: z.number(),
	email: z.string().nullable().optional(),
	userId: z.string().nullable().optional(),
	username: z.string().nullable().optional(),
	userGivenName: z.string().nullable().optional(),
	userFamilyName: z.string().nullable().optional(),
	userGrade: z.string().nullable().optional(),
	campusId: z.string().nullable().optional(),
	campusName: z.string().nullable().optional(),
	courseId: z.string().nullable().optional(),
	courseName: z.string().nullable().optional(),
	app: z.string().nullable().optional(),
	subject: z.string().nullable().optional(),
	activityId: z.string().nullable().optional(),
	activityName: z.string().nullable().optional(),
	eventType: z.string().nullable().optional(),
	alphaLevel: z.string().nullable().optional(),
	datetime: z.string(),
	date: z.string(),
	sendTime: z.string().nullable().optional(),
	generatedAt: z.string().nullable().optional(),
	sensor: z.string().nullable().optional(),
	source: z.string().nullable().optional(),
	enrollmentId: z.string().nullable().optional(),
	day: z.number(),
	dayOfWeek: z.number(),
	month: z.number(),
	year: z.number(),
	activeSeconds: z.coerce.number().nullable().optional(),
	inactiveSeconds: z.coerce.number().nullable().optional(),
	wasteSeconds: z.coerce.number().nullable().optional(),
	xpEarned: z.coerce.number().nullable().optional(),
	totalQuestions: z.coerce.number().nullable().optional(),
	correctQuestions: z.coerce.number().nullable().optional(),
	masteredUnits: z.coerce.number().nullable().optional(),
});

const WeeklyFactsResponseSchema = z.object({
	message: z.string(),
	startDate: z.string(),
	endDate: z.string(),
	facts: z.array(WeeklyFactSchema),
});

const HighestGradeEntrySchema = z
	.object({
		grade: z.unknown().optional(),
		source: z.unknown().optional(),
		evidence: z.unknown().optional(),
	})
	.catchall(z.unknown());

const HighestGradeResponseSchema = z.object({
	studentId: z.string(),
	subject: z.string(),
	grades: z
		.object({
			highestGradeOverall: HighestGradeEntrySchema.optional(),
			ritGrade: HighestGradeEntrySchema.optional(),
			edulasticGrade: HighestGradeEntrySchema.optional(),
			placementGrade: HighestGradeEntrySchema.optional(),
			testOutGrade: HighestGradeEntrySchema.optional(),
		})
		.catchall(HighestGradeEntrySchema),
});

const TimeSavedCalculationSchema = z.object({
	formula: z.string(),
	hoursSavedPerDay: z.number(),
	standardSchoolHoursPerDay: z.number(),
	timebackHoursPerDay: z.number(),
});

const TimeSavedResponseSchema = z.object({
	data: z.object({
		totalHoursSaved: z.number(),
		totalDaysSaved: z.number(),
		schoolDaysElapsed: z.number(),
		earliestStartDate: z.string(),
		schoolYearStartDate: z.string(),
		calculation: TimeSavedCalculationSchema,
	}),
});

const ACTIVITY_OPERATION: OperationSpec = {
	alias: "getEdubridgeActivityFacts",
	method: "get",
	path: "/edubridge/analytics/activity",
	pathTemplate: "/edubridge/analytics/activity",
	description: "Fetch Edubridge analytics activity facts",
	requestFormat: "json",
	parameters: [],
	response: ActivityFactsResponseSchema,
	errors: [],
};

const WEEKLY_OPERATION: OperationSpec = {
	alias: "getEdubridgeWeeklyFacts",
	method: "get",
	path: "/edubridge/analytics/facts/weekly",
	pathTemplate: "/edubridge/analytics/facts/weekly",
	description: "Fetch Edubridge weekly analytics facts",
	requestFormat: "json",
	parameters: [],
	response: WeeklyFactsResponseSchema,
	errors: [],
};

const HIGHEST_GRADE_OPERATION: OperationSpec = {
	alias: "getEdubridgeHighestGrade",
	method: "get",
	path: "/edubridge/analytics/highestGradeMastered/{studentId}/{subject}",
	pathTemplate:
		"/edubridge/analytics/highestGradeMastered/{studentId}/{subject}",
	description: "Fetch highest grade mastered for a student",
	requestFormat: "json",
	parameters: [],
	response: HighestGradeResponseSchema,
	errors: [],
};

const TIME_SAVED_OPERATION: OperationSpec = {
	alias: "getEdubridgeTimeSaved",
	method: "get",
	path: "/edubridge/time-saved/user/{studentId}",
	pathTemplate: "/edubridge/time-saved/user/{studentId}",
	description: "Fetch time saved metrics for a student",
	requestFormat: "json",
	parameters: [],
	response: TimeSavedResponseSchema,
	errors: [],
};

export type ActivityFactsParams = z.input<typeof ActivityFactsParamsSchema>;
export type WeeklyFactsParams = z.input<typeof WeeklyFactsParamsSchema>;
export type HighestGradeParams = z.input<typeof HighestGradeParamsSchema>;
export type TimeSavedParams = z.input<typeof TimeSavedParamsSchema>;

export type ActivityFactsResponse = z.infer<typeof ActivityFactsResponseSchema>;
export type WeeklyFactsResponse = z.infer<typeof WeeklyFactsResponseSchema>;
export type HighestGradeResponse = z.infer<typeof HighestGradeResponseSchema>;
export type TimeSavedResponse = z.infer<typeof TimeSavedResponseSchema>;

export async function getActivityFacts(
	client: EdubridgeClient,
	params: ActivityFactsParams,
): Promise<ActivityFactsResponse> {
	let parsed: z.infer<typeof ActivityFactsParamsSchema>;
	try {
		parsed = ActivityFactsParamsSchema.parse(params);
	} catch (error) {
		if (error instanceof ZodError) {
			throw wrapValidationError(client, ACTIVITY_OPERATION, error);
		}
		throw error;
	}

	const query = buildQuery({
		studentId: parsed.studentId,
		email: parsed.email,
		startDate: parsed.startDate,
		endDate: parsed.endDate,
		timezone: parsed.timezone,
	});

	const response = await client.fetch(`${ACTIVITY_OPERATION.path}${query}`, {
		method: "GET",
	});

	if (!response.ok) {
		const payload = await readJson(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: ACTIVITY_OPERATION,
			status: response.status,
			payload,
		});
	}

	const payload = await readJson(response);
	try {
		return ActivityFactsResponseSchema.parse(payload);
	} catch (error) {
		if (error instanceof ZodError) {
			throw TimebackClientError.responseValidation({
				service: client.service,
				environment: client.environment,
				operation: ACTIVITY_OPERATION,
				status: response.status,
				payload,
				issues: error.issues,
			});
		}
		throw error;
	}
}

export async function getWeeklyFacts(
	client: EdubridgeClient,
	params: WeeklyFactsParams,
): Promise<WeeklyFactsResponse> {
	let parsed: z.infer<typeof WeeklyFactsParamsSchema>;
	try {
		parsed = WeeklyFactsParamsSchema.parse(params);
	} catch (error) {
		if (error instanceof ZodError) {
			throw wrapValidationError(client, WEEKLY_OPERATION, error);
		}
		throw error;
	}

	const query = buildQuery({
		studentId: parsed.studentId,
		email: parsed.email,
		startDate: parsed.startDate,
		endDate: parsed.endDate,
		timezone: parsed.timezone,
	});

	const response = await client.fetch(`${WEEKLY_OPERATION.path}${query}`, {
		method: "GET",
	});

	if (!response.ok) {
		const payload = await readJson(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: WEEKLY_OPERATION,
			status: response.status,
			payload,
		});
	}

	const payload = await readJson(response);
	try {
		return WeeklyFactsResponseSchema.parse(payload);
	} catch (error) {
		if (error instanceof ZodError) {
			throw TimebackClientError.responseValidation({
				service: client.service,
				environment: client.environment,
				operation: WEEKLY_OPERATION,
				status: response.status,
				payload,
				issues: error.issues,
			});
		}
		throw error;
	}
}

export async function getHighestGrade(
	client: EdubridgeClient,
	params: HighestGradeParams,
): Promise<HighestGradeResponse> {
	let parsed: z.infer<typeof HighestGradeParamsSchema>;
	try {
		parsed = HighestGradeParamsSchema.parse(params);
	} catch (error) {
		if (error instanceof ZodError) {
			throw wrapValidationError(client, HIGHEST_GRADE_OPERATION, error);
		}
		throw error;
	}

	const response = await client.fetch(
		`/edubridge/analytics/highestGradeMastered/${encodeURIComponent(parsed.studentId)}/${encodeURIComponent(parsed.subject)}`,
		{ method: "GET" },
	);

	if (!response.ok) {
		const payload = await readJson(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: HIGHEST_GRADE_OPERATION,
			status: response.status,
			payload,
		});
	}

	const payload = await readJson(response);
	try {
		return HighestGradeResponseSchema.parse(payload);
	} catch (error) {
		if (error instanceof ZodError) {
			throw TimebackClientError.responseValidation({
				service: client.service,
				environment: client.environment,
				operation: HIGHEST_GRADE_OPERATION,
				status: response.status,
				payload,
				issues: error.issues,
			});
		}
		throw error;
	}
}

export async function getTimeSaved(
	client: EdubridgeClient,
	params: TimeSavedParams,
): Promise<TimeSavedResponse> {
	let parsed: z.infer<typeof TimeSavedParamsSchema>;
	try {
		parsed = TimeSavedParamsSchema.parse(params);
	} catch (error) {
		if (error instanceof ZodError) {
			throw wrapValidationError(
				client,
				TIME_SAVED_OPERATION,
				error,
				"studentId",
			);
		}
		throw error;
	}

	const response = await client.fetch(
		`/edubridge/time-saved/user/${encodeURIComponent(parsed.studentId)}`,
		{ method: "GET" },
	);

	if (!response.ok) {
		const payload = await readJson(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: TIME_SAVED_OPERATION,
			status: response.status,
			payload,
		});
	}

	const payload = await readJson(response);
	try {
		return TimeSavedResponseSchema.parse(payload);
	} catch (error) {
		if (error instanceof ZodError) {
			throw TimebackClientError.responseValidation({
				service: client.service,
				environment: client.environment,
				operation: TIME_SAVED_OPERATION,
				status: response.status,
				payload,
				issues: error.issues,
			});
		}
		throw error;
	}
}
