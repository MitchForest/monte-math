import type { z } from "zod";

export type HttpMethod =
	| "get"
	| "put"
	| "post"
	| "delete"
	| "options"
	| "head"
	| "patch"
	| "trace";

export type RequestFormat =
	| "json"
	| "form-data"
	| "form-url"
	| "binary"
	| "text";

export type OperationParameterLocation = "path" | "query" | "header";

export type OperationParameter = {
	name: string;
	description?: string;
	location: OperationParameterLocation;
	required: boolean;
	schema: z.ZodTypeAny;
};

export type OperationBody = {
	required: boolean;
	schema: z.ZodTypeAny;
	description?: string;
	contentTypes: ReadonlyArray<string>;
};

export type OperationError = {
	status: number | "default";
	description?: string;
	schema: z.ZodTypeAny;
};

export type OperationSpec = {
	alias: string;
	method: HttpMethod;
	path: string;
	pathTemplate: string;
	description?: string;
	requestFormat?: RequestFormat;
	parameters: ReadonlyArray<OperationParameter>;
	body?: OperationBody;
	response: z.ZodTypeAny;
	errors: ReadonlyArray<OperationError>;
};

export type OperationSpecMap = Record<string, OperationSpec>;

export type OperationAlias<Map extends OperationSpecMap> = Extract<
	keyof Map,
	string
>;

export type OperationByAlias<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
> = Map[Alias];

type Simplify<Type> = { [Key in keyof Type]: Type[Key] } & {};

type ParameterForLocation<
	Spec extends OperationSpec,
	Location extends OperationParameterLocation,
> = Extract<Spec["parameters"][number], { location: Location }>;

type ParameterSchemas<
	Spec extends OperationSpec,
	Location extends OperationParameterLocation,
> = ParameterForLocation<Spec, Location> extends never
	? Record<never, never>
	: {
			[Name in ParameterForLocation<Spec, Location>["name"]]: Extract<
				ParameterForLocation<Spec, Location>,
				{ name: Name }
			>["schema"];
		};

type ParameterInputs<
	Spec extends OperationSpec,
	Location extends OperationParameterLocation,
> = {
	[Name in keyof ParameterSchemas<Spec, Location>]: ParameterSchemas<
		Spec,
		Location
	>[Name] extends z.ZodTypeAny
		? z.input<ParameterSchemas<Spec, Location>[Name]>
		: never;
};

type RequiredParameterNames<
	Spec extends OperationSpec,
	Location extends OperationParameterLocation,
> = Extract<ParameterForLocation<Spec, Location>, { required: true }>["name"];

type BuildParameterArgs<
	Spec extends OperationSpec,
	Location extends OperationParameterLocation,
> = ParameterInputs<Spec, Location> extends infer Inputs
	? Inputs extends Record<string, unknown>
		? keyof Inputs extends never
			? Record<never, never>
			: Simplify<
					{
						[Name in Extract<
							RequiredParameterNames<Spec, Location>,
							keyof Inputs
						>]: Inputs[Name];
					} & {
						[Name in Exclude<
							keyof Inputs,
							RequiredParameterNames<Spec, Location>
						>]?: Inputs[Name];
					}
				>
		: Record<never, never>
	: Record<never, never>;

type PathArgs<Spec extends OperationSpec> = BuildParameterArgs<
	Spec,
	"path"
> extends infer PathInput
	? PathInput extends Record<string, unknown>
		? keyof PathInput extends never
			? Record<never, never>
			: { path: PathInput }
		: Record<never, never>
	: Record<never, never>;

type QueryArgs<Spec extends OperationSpec> = BuildParameterArgs<
	Spec,
	"query"
> extends infer QueryInput
	? QueryInput extends Record<string, unknown>
		? keyof QueryInput extends never
			? Record<never, never>
			: RequiredParameterNames<Spec, "query"> extends never
				? { query?: QueryInput }
				: { query: QueryInput }
		: Record<never, never>
	: Record<never, never>;

type HeaderArgs<Spec extends OperationSpec> = BuildParameterArgs<
	Spec,
	"header"
> extends infer HeaderInput
	? HeaderInput extends Record<string, unknown>
		? keyof HeaderInput extends never
			? Record<never, never>
			: RequiredParameterNames<Spec, "header"> extends never
				? { headers?: HeaderInput }
				: { headers: HeaderInput }
		: Record<never, never>
	: Record<never, never>;

type BodyArgs<Spec extends OperationSpec> =
	Spec["body"] extends infer BodyDefinition
		? BodyDefinition extends OperationBody
			? BodyDefinition["schema"] extends z.ZodTypeAny
				? BodyDefinition["required"] extends true
					? { body: z.input<BodyDefinition["schema"]> }
					: { body?: z.input<BodyDefinition["schema"]> }
				: Record<never, never>
			: Record<never, never>
		: Record<never, never>;

export type OperationCallArgs<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
> = Simplify<
	PathArgs<OperationByAlias<Map, Alias>> &
		QueryArgs<OperationByAlias<Map, Alias>> &
		HeaderArgs<OperationByAlias<Map, Alias>> &
		BodyArgs<OperationByAlias<Map, Alias>> & {
			requestInit?: Omit<RequestInit, "method">;
		}
>;

export type OperationResponse<
	Map extends OperationSpecMap,
	Alias extends OperationAlias<Map>,
> = OperationByAlias<Map, Alias>["response"] extends z.ZodTypeAny
	? z.output<OperationByAlias<Map, Alias>["response"]>
	: never;
