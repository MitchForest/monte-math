import type { z } from "zod";

import type { TimebackEnvironment, TimebackService } from "../env";
import type { OperationSpec } from "../types";

export type TimebackClientErrorKind =
	| "request-validation"
	| "response-validation"
	| "http-error";

export type OperationIdentifier = {
	service: TimebackService;
	environment: TimebackEnvironment;
	operation: OperationSpec;
};

export type RequestValidationContext = OperationIdentifier & {
	parameter: string;
	location: string;
	issues: z.ZodIssue[];
};

export type ResponseValidationContext = OperationIdentifier & {
	status: number;
	issues: z.ZodIssue[];
	payload: unknown;
};

export type HttpErrorContext = OperationIdentifier & {
	status: number;
	payload: unknown;
};

export class TimebackClientError extends Error {
	public readonly kind: TimebackClientErrorKind;
	public readonly service: TimebackService;
	public readonly environment: TimebackEnvironment;
	public readonly operation: OperationSpec;
	public readonly status?: number;
	public readonly payload?: unknown;
	public readonly issues?: z.ZodIssue[];
	public readonly parameter?: string;
	public readonly location?: string;

	private constructor(
		kind: TimebackClientErrorKind,
		message: string,
		context: {
			service: TimebackService;
			environment: TimebackEnvironment;
			operation: OperationSpec;
			status?: number;
			payload?: unknown;
			issues?: z.ZodIssue[];
			parameter?: string;
			location?: string;
		},
	) {
		super(message);
		this.name = "TimebackClientError";
		this.kind = kind;
		this.service = context.service;
		this.environment = context.environment;
		this.operation = context.operation;
		this.status = context.status;
		this.payload = context.payload;
		this.issues = context.issues;
		this.parameter = context.parameter;
		this.location = context.location;
	}

	static requestValidation(context: RequestValidationContext) {
		return new TimebackClientError(
			"request-validation",
			`Invalid ${context.location} parameter "${context.parameter}" for ${context.operation.alias ?? `${context.operation.method.toUpperCase()} ${context.operation.path}`}`,
			{
				service: context.service,
				environment: context.environment,
				operation: context.operation,
				issues: context.issues,
				parameter: context.parameter,
				location: context.location,
			},
		);
	}

	static responseValidation(context: ResponseValidationContext) {
		return new TimebackClientError(
			"response-validation",
			`Invalid response received (${context.status}) for ${context.operation.alias ?? `${context.operation.method.toUpperCase()} ${context.operation.path}`}`,
			{
				service: context.service,
				environment: context.environment,
				operation: context.operation,
				status: context.status,
				payload: context.payload,
				issues: context.issues,
			},
		);
	}

	static httpError(context: HttpErrorContext) {
		return new TimebackClientError(
			"http-error",
			`TimeBack ${context.service} request failed with status ${context.status}`,
			{
				service: context.service,
				environment: context.environment,
				operation: context.operation,
				status: context.status,
				payload: context.payload,
			},
		);
	}
}
