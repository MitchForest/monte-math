import { ZodError, z } from "zod";

import { TimebackClientError } from "../http";
import type { EdubridgeClient } from "./client";

const MapProfileParamsSchema = z.object({
	userId: z.string().min(1),
});

const MapProfileResponseSchema = z.object({
	data: z.array(
		z.object({
			title: z.string(),
			pdfUrl: z.union([z.string(), z.null()]),
			tests: z.array(z.string()),
			grade: z.string().nullable().optional(),
			schoolname: z.string().nullable().optional(),
			assessmentResultProviderSystem: z.string().nullable().optional(),
		}),
	),
});

export type MapProfileParams = z.input<typeof MapProfileParamsSchema>;
export type MapProfileResponse = z.infer<typeof MapProfileResponseSchema>;

export async function getMapProfile(
	client: EdubridgeClient,
	params: MapProfileParams,
): Promise<MapProfileResponse> {
	const parsed = MapProfileParamsSchema.parse(params);

	const response = await client.fetch(
		`/edubridge/learning-reports/map-profile/${encodeURIComponent(parsed.userId)}`,
		{ method: "GET" },
	);

	if (!response.ok) {
		const payload = await readPayload(response);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation: {
				alias: "getMapProfile",
				method: "get",
				path: "/edubridge/learning-reports/map-profile/{userId}",
				pathTemplate: "/edubridge/learning-reports/map-profile/{userId}",
				description: "Get the MAP profile for a given student",
				requestFormat: "json",
				parameters: [],
				response: MapProfileResponseSchema,
				errors: [],
			},
			status: response.status,
			payload,
		});
	}

	const payload = await readPayload(response);
	try {
		return MapProfileResponseSchema.parse(payload);
	} catch (error) {
		if (error instanceof ZodError) {
			throw TimebackClientError.responseValidation({
				service: client.service,
				environment: client.environment,
				operation: {
					alias: "getMapProfile",
					method: "get",
					path: "/edubridge/learning-reports/map-profile/{userId}",
					pathTemplate: "/edubridge/learning-reports/map-profile/{userId}",
					description: "Get the MAP profile for a given student",
					requestFormat: "json",
					parameters: [],
					response: MapProfileResponseSchema,
					errors: [],
				},
				status: response.status,
				payload,
				issues: error.issues,
			});
		}
		throw error;
	}
}

async function readPayload(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}
