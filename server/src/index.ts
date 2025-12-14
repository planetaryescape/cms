import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import type { ApiResponse } from "shared/dist/types";
import { testConnection } from "./db";

// API routes only (for RPC client type inference)
export const apiRoutes = new Hono()
	.use(cors())
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.get("/hello", async (c) => {
		const data: ApiResponse = {
			message: "Sup",
			success: true,
		};

		return c.json(data, { status: 200 });
	})
	.get("/db-health", async (c) => {
		const result = await testConnection();
		return c.json(result, { status: result.success ? 200 : 500 });
	});

// Full app with static serving
export const app = new Hono()
	.route("/api", apiRoutes)
	.use("*", serveStatic({ root: "./static" }))
	.get("*", serveStatic({ path: "./static/index.html" }));

Bun.serve({
	fetch: app.fetch,
	port: process.env.PORT || 3000,
});

console.log(`Server running on port ${process.env.PORT || 3000}`);

export default app;
