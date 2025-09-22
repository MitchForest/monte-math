import { describe, expect, it, mock } from "bun:test";

import type { TimebackServiceConfig } from "../../src/env";
import { createTimebackFetch } from "../../src/http/client";

describe("createTimebackFetch", () => {
	it("attaches bearer tokens, retries on 401, and annotates responses", async () => {
		const issuedTokens = ["token-1", "token-2"];
		const oauthClient = {
			getAccessToken: mock(async () => issuedTokens.shift() ?? "token-final"),
			invalidate: mock(() => {
				return undefined;
			}),
		};

		const responses = [
			new Response("unauthorized", { status: 401 }),
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		];

		const fetcher = mock<
			(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
		>(async () => {
			const response = responses.shift();
			if (!response) {
				throw new Error("No more mock responses");
			}
			return response;
		});

		const config: TimebackServiceConfig = {
			service: "oneroster",
			environment: "staging",
			baseUrl: "https://example.com/timeback",
			tokenUrl: "https://example.com/oauth",
		};

		const timebackFetch = createTimebackFetch({
			config,
			oauthClient,
			fetcher,
			userAgent: "test-agent",
		});

		const response = await timebackFetch("/students", { method: "GET" });

		expect(fetcher.mock.calls.length).toBe(2);
		expect(oauthClient.invalidate.mock.calls.length).toBe(1);
		expect(await response.json()).toEqual({ ok: true });
		expect(Reflect.get(response, "timebackService")).toBe("oneroster");
		expect(Reflect.get(response, "timebackEnvironment")).toBe("staging");

		const [firstCall, secondCall] = fetcher.mock.calls;
		expect(firstCall?.[0]).toBe("https://example.com/timeback/students");
		expect(secondCall?.[0]).toBe("https://example.com/timeback/students");

		const headers = new Headers(firstCall?.[1]?.headers);
		expect(headers.get("authorization")).toBe("Bearer token-1");
		expect(headers.get("user-agent")).toBe("test-agent");
	});
});
