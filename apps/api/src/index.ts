import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json({ message: "Monte Math API" }));

app.get("/health", (c) => c.json({ status: "ok" }));

export default {
	port: process.env.PORT || 3001,
	fetch: app.fetch,
};
