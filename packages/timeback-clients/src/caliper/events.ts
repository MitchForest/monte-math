import { ZodError, z } from "zod";

import { TimebackClientError } from "../http";
import type { OperationSpec } from "../types";
import type { CaliperClient } from "./client";

const ListCaliperEventsParamsSchema = z
	.object({
		actorId: z.string().min(1).optional(),
		startDate: z.string().min(1).optional(),
		endDate: z.string().min(1).optional(),
		eventType: z.string().min(1).optional(),
		limit: z.number().int().positive().max(500).optional(),
	})
	.default({});

const LIST_CALIPER_EVENTS_OPERATION: OperationSpec = {
	alias: "listCaliperEvents",
	method: "get",
	path: "/caliper/events",
	pathTemplate: "/caliper/events",
	description: "Fetch Caliper events for the configured organization",
	requestFormat: "json",
	parameters: [
		{ name: "actorId", location: "query", required: false, schema: z.string() },
		{
			name: "startDate",
			location: "query",
			required: false,
			schema: z.string(),
		},
		{ name: "endDate", location: "query", required: false, schema: z.string() },
		{
			name: "eventType",
			location: "query",
			required: false,
			schema: z.string(),
		},
		{
			name: "limit",
			location: "query",
			required: false,
			schema: z.number().int().positive().max(500),
		},
	],
	response: z.unknown(),
	errors: [],
};

export type ListCaliperEventsParams = z.input<
	typeof ListCaliperEventsParamsSchema
>;

function serializeQuery(
	params: z.infer<typeof ListCaliperEventsParamsSchema>,
): string {
	const search = new URLSearchParams();
	if (params.actorId) {
		search.set("actorId", params.actorId);
	}
	if (params.startDate) {
		search.set("startDate", params.startDate);
	}
	if (params.endDate) {
		search.set("endDate", params.endDate);
	}
	if (params.eventType) {
		search.set("eventType", params.eventType);
	}
	if (typeof params.limit === "number") {
		search.set("limit", params.limit.toString());
	}
	const query = search.toString();
	return query.length > 0 ? `?${query}` : "";
}

function wrapValidationError(
	client: CaliperClient,
	error: ZodError,
): TimebackClientError {
	const firstIssue = error.issues.at(0);
	const parameter =
		typeof firstIssue?.path?.[0] === "string" ? firstIssue.path[0] : "query";
	return TimebackClientError.requestValidation({
		service: client.service,
		environment: client.environment,
		operation: LIST_CALIPER_EVENTS_OPERATION,
		parameter,
		location: "query",
		issues: error.issues,
	});
}

async function readPayload(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

export async function listCaliperEvents(
	client: CaliperClient,
	params: ListCaliperEventsParams = {},
): Promise<unknown> {
	let parsed: z.infer<typeof ListCaliperEventsParamsSchema>;
	try {
		parsed = ListCaliperEventsParamsSchema.parse(params);
	} catch (error) {
		if (error instanceof ZodError) {
			throw wrapValidationError(client, error);
		}
		throw error;
	}

	const suffix = serializeQuery(parsed);
	const response = await client.fetch(`/caliper/events${suffix}`, {
		method: "GET",
	});

	if (!response.ok) {
		const payload = await readPayload(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: LIST_CALIPER_EVENTS_OPERATION,
			status: response.status,
			payload,
		});
	}

	return readPayload(response);
}
