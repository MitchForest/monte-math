import { describe, expect, test } from "bun:test";

import { TimebackClientError } from "../http";
import type { CaliperClient } from "./client";
import { listCaliperEvents } from "./events";

describe("listCaliperEvents", () => {
	test("serialises query params", async () => {
		const requested: string[] = [];
		const client = {
			service: "caliper",
			environment: "staging",
			fetch: async (path: string) => {
				requested.push(path);
				return new Response("[]", { status: 200 });
			},
		} as unknown as CaliperClient;

		await listCaliperEvents(client, {
			actorId: "student-1",
			startDate: "2025-09-20T00:00:00Z",
			limit: 50,
		});

		expect(requested).toHaveLength(1);
		expect(requested[0]).toContain("actorId=student-1");
		expect(requested[0]).toContain("limit=50");
		expect(requested[0].startsWith("/caliper/events?")).toBe(true);
	});

	test("validates parameters", async () => {
		const client = {
			service: "caliper",
			environment: "staging",
			fetch: async () => new Response("[]", { status: 200 }),
		} as unknown as CaliperClient;

		await expect(
			listCaliperEvents(client, { limit: 0 }),
		).rejects.toBeInstanceOf(TimebackClientError);
	});
});
