import type { ServiceClient } from "../internal";
import type {
	OperationAlias,
	OperationBody,
	OperationByAlias,
	OperationCallArgs,
	OperationError,
	OperationParameter,
	OperationResponse,
	OperationSpec,
	OperationSpecMap,
} from "../types";

import { TimebackClientError } from "./errors";

export async function callOperation<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
>(
	client: ServiceClient,
	operations: Map,
	alias: Alias,
	args: OperationCallArgs<Map, Alias>,
): Promise<OperationResponse<Map, Alias>> {
	const operation = operations[alias];
	if (!operation) {
		throw new Error(`Unknown operation alias: ${alias}`);
	}
	return executeOperation(client, operation, args);
}

export function getOperationSpec<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
>(operations: Map, alias: Alias): OperationByAlias<Map, Alias> | undefined {
	return operations[alias];
}

async function executeOperation<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
>(
	client: ServiceClient,
	operation: OperationByAlias<Map, Alias>,
	args: OperationCallArgs<Map, Alias>,
): Promise<OperationResponse<Map, Alias>> {
	const pathValues = new Map<string, string>();
	const queryParams = new URLSearchParams();
	const parameterHeaders = new Headers();

	const pathArgs = (args as { path?: Record<string, unknown> }).path ?? {};
	const queryArgs = (args as { query?: Record<string, unknown> }).query ?? {};
	const headerArgs =
		(args as { headers?: Record<string, unknown> }).headers ?? {};
	const bodyArg = (args as { body?: unknown }).body;

	const definedQueryKeys = new Set<string>();

	for (const parameter of operation.parameters) {
		if (parameter.location === "path") {
			const value = pathArgs[parameter.name];
			const parsed = parseParameterValue(
				client,
				operation,
				parameter,
				value,
				"path",
			);
			pathValues.set(parameter.name, serializePathValue(parsed));
			continue;
		}

		if (parameter.location === "query") {
			definedQueryKeys.add(parameter.name);
			const value = queryArgs[parameter.name];
			const parsed = parseParameterValue(
				client,
				operation,
				parameter,
				value,
				"query",
			);
			appendQueryValue(queryParams, parameter.name, parsed);
			continue;
		}

		if (parameter.location === "header") {
			const value = headerArgs[parameter.name];
			const parsed = parseParameterValue(
				client,
				operation,
				parameter,
				value,
				"header",
			);
			if (parsed !== undefined) {
				parameterHeaders.set(parameter.name, serializeHeaderValue(parsed));
			}
		}
	}

	for (const [key, value] of Object.entries(queryArgs)) {
		if (definedQueryKeys.has(key)) {
			continue;
		}
		appendQueryValue(queryParams, key, value);
	}

	const headers = new Headers(args.requestInit?.headers);

	for (const [key, value] of Object.entries(headerArgs)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (!parameterHeaders.has(key)) {
			parameterHeaders.set(key, String(value));
		}
	}

	parameterHeaders.forEach((value, key) => {
		headers.set(key, value);
	});

	const bodyInit = prepareRequestBody(client, operation, bodyArg, headers);

	const url = buildUrl(operation.path, pathValues, queryParams);
	const requestInit: RequestInit = {
		...args.requestInit,
		method: operation.method.toUpperCase(),
		headers,
		body: bodyInit,
	};

	const response = await client.fetch(url, requestInit);
	const payload = await readResponsePayload(response);

	if (!response.ok) {
		const normalizedPayload = await parseErrorPayload(
			operation,
			response,
			payload,
		);
		throw TimebackClientError.httpError({
			service: client.service,
			environment: client.environment,
			operation,
			status: response.status,
			payload: normalizedPayload,
		});
	}

	const parsed = operation.response.safeParse(payload);
	if (!parsed.success) {
		throw TimebackClientError.responseValidation({
			service: client.service,
			environment: client.environment,
			operation,
			status: response.status,
			payload,
			issues: parsed.error.issues,
		});
	}

	return parsed.data as OperationResponse<Map, Alias>;
}

function parseParameterValue(
	client: ServiceClient,
	operation: OperationSpec,
	parameter: OperationParameter,
	value: unknown,
	location: "path" | "query" | "header",
): unknown {
	if (value === undefined || value === null) {
		if (parameter.required) {
			throw TimebackClientError.requestValidation({
				service: client.service,
				environment: client.environment,
				operation,
				parameter: parameter.name,
				location,
				issues: [
					{
						code: "custom",
						message: `${capitalize(location)} parameter is required`,
						path: [parameter.name],
					},
				],
			});
		}
		return undefined;
	}

	const parsed = parameter.schema.safeParse(value);
	if (!parsed.success) {
		throw TimebackClientError.requestValidation({
			service: client.service,
			environment: client.environment,
			operation,
			parameter: parameter.name,
			location,
			issues: parsed.error.issues,
		});
	}

	return parsed.data;
}

function prepareRequestBody(
	client: ServiceClient,
	operation: OperationSpec,
	rawBody: unknown,
	headers: Headers,
): BodyInit | undefined {
	const { body } = operation;
	if (!body) {
		return undefined;
	}

	const parsedBody = parseBodyValue(client, operation, body, rawBody);
	if (parsedBody === undefined) {
		return undefined;
	}

	return serializeBody(client, operation, body, parsedBody, headers);
}

function parseBodyValue(
	client: ServiceClient,
	operation: OperationSpec,
	body: OperationBody,
	value: unknown,
): unknown {
	if (value === undefined || value === null) {
		if (body.required) {
			throw TimebackClientError.requestValidation({
				service: client.service,
				environment: client.environment,
				operation,
				parameter: "body",
				location: "body",
				issues: [
					{
						code: "custom",
						message: "Request body is required",
						path: ["body"],
					},
				],
			});
		}
		return undefined;
	}

	const parsed = body.schema.safeParse(value);
	if (!parsed.success) {
		throw TimebackClientError.requestValidation({
			service: client.service,
			environment: client.environment,
			operation,
			parameter: "body",
			location: "body",
			issues: parsed.error.issues,
		});
	}

	return parsed.data;
}

function serializeBody(
	client: ServiceClient,
	operation: OperationSpec,
	body: OperationBody,
	value: unknown,
	headers: Headers,
): BodyInit | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	const format = operation.requestFormat ?? "json";

	if (format === "json") {
		ensureContentType(headers, body.contentTypes, "application/json");
		return JSON.stringify(value);
	}

	if (format === "form-data") {
		if (value instanceof FormData) {
			return value;
		}
		if (typeof value !== "object" || value === null) {
			throw TimebackClientError.requestValidation({
				service: client.service,
				environment: client.environment,
				operation,
				parameter: "body",
				location: "body",
				issues: [
					{
						code: "custom",
						message:
							"Expected an object or FormData for multipart request body",
						path: ["body"],
					},
				],
			});
		}
		const formData = new FormData();
		for (const [key, formValue] of Object.entries(value)) {
			if (formValue === undefined || formValue === null) {
				continue;
			}
			if (Array.isArray(formValue)) {
				for (const item of formValue) {
					appendFormData(formData, key, item);
				}
				continue;
			}
			appendFormData(formData, key, formValue);
		}
		return formData;
	}

	if (format === "form-url") {
		if (typeof value !== "object" || value === null) {
			throw TimebackClientError.requestValidation({
				service: client.service,
				environment: client.environment,
				operation,
				parameter: "body",
				location: "body",
				issues: [
					{
						code: "custom",
						message:
							"Expected an object for x-www-form-urlencoded request body",
						path: ["body"],
					},
				],
			});
		}
		ensureContentType(
			headers,
			body.contentTypes,
			"application/x-www-form-urlencoded",
		);
		const searchParams = new URLSearchParams();
		for (const [key, formValue] of Object.entries(value)) {
			if (formValue === undefined || formValue === null) {
				continue;
			}
			if (Array.isArray(formValue)) {
				for (const item of formValue) {
					searchParams.append(key, String(item));
				}
				continue;
			}
			searchParams.append(key, String(formValue));
		}
		return searchParams;
	}

	if (format === "binary") {
		if (
			value instanceof ArrayBuffer ||
			ArrayBuffer.isView(value) ||
			value instanceof Blob
		) {
			return value as BodyInit;
		}
		throw TimebackClientError.requestValidation({
			service: client.service,
			environment: client.environment,
			operation,
			parameter: "body",
			location: "body",
			issues: [
				{
					code: "custom",
					message:
						"Expected ArrayBuffer, TypedArray, or Blob for binary request body",
					path: ["body"],
				},
			],
		});
	}

	return value as BodyInit;
}

function ensureContentType(
	headers: Headers,
	supportedContentTypes: ReadonlyArray<string>,
	fallback: string,
) {
	if (headers.has("content-type")) {
		return;
	}
	const preferred =
		supportedContentTypes.find((type) => type.includes("json")) ??
		supportedContentTypes[0] ??
		fallback;
	headers.set("content-type", preferred);
}

function buildUrl(
	template: string,
	pathValues: Map<string, string>,
	searchParams: URLSearchParams,
): string {
	let path = template;
	for (const [key, value] of pathValues.entries()) {
		const pattern = new RegExp(`(:|\\{)${escapeRegExp(key)}(\\})?`, "g");
		path = path.replace(pattern, value);
	}
	const query = searchParams.toString();
	return query.length > 0 ? `${path}?${query}` : path;
}

function serializePathValue(value: unknown): string {
	if (typeof value === "string") {
		return encodeURIComponent(value);
	}
	return encodeURIComponent(String(value));
}

function serializeHeaderValue(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return JSON.stringify(value);
}

function appendQueryValue(
	params: URLSearchParams,
	key: string,
	value: unknown,
): void {
	if (value === undefined || value === null) {
		return;
	}
	if (Array.isArray(value)) {
		for (const entry of value) {
			appendQueryValue(params, key, entry);
		}
		return;
	}
	if (value instanceof Date) {
		params.append(key, value.toISOString());
		return;
	}
	params.append(key, String(value));
}

function appendFormData(formData: FormData, key: string, value: unknown) {
	const isBlob = typeof Blob !== "undefined" && value instanceof Blob;
	const isFile =
		typeof File !== "undefined" &&
		typeof File === "function" &&
		value instanceof File;
	if (isBlob || isFile) {
		formData.append(key, value as Blob);
		return;
	}
	formData.append(key, String(value));
}

async function readResponsePayload(response: Response): Promise<unknown> {
	if (response.status === 204 || response.status === 205) {
		return undefined;
	}

	const contentType = response.headers.get("content-type") ?? "";
	try {
		if (contentType.includes("application/json")) {
			return await response.json();
		}
		if (contentType.includes("text/")) {
			return await response.text();
		}
		if (contentType.includes("application/octet-stream")) {
			return new Uint8Array(await response.arrayBuffer());
		}
	} catch (error) {
		if (error instanceof Error) {
			error.message = `Failed to read response payload: ${error.message}`;
		}
		throw error;
	}

	return await response.text();
}

async function parseErrorPayload(
	operation: OperationSpec,
	response: Response,
	payload: unknown,
): Promise<unknown> {
	const matchingError = findMatchingError(operation.errors, response.status);
	if (!matchingError) {
		return payload;
	}

	const parsed = matchingError.schema.safeParse(payload);
	if (parsed.success) {
		return parsed.data;
	}
	return payload;
}

function findMatchingError(
	errors: ReadonlyArray<OperationError>,
	status: number,
): OperationError | undefined {
	const explicit = errors.find((error) => error.status === status);
	if (explicit) {
		return explicit;
	}
	return errors.find((error) => error.status === "default");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function capitalize(value: string): string {
	if (value.length === 0) {
		return value;
	}
	return value.charAt(0).toUpperCase() + value.slice(1);
}
