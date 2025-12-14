import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import type { ApiResponse } from "shared/dist/types";
import { testConnection } from "./db";
import { auth } from "./lib/auth";

// API routes only (for RPC client type inference)
export const apiRoutes = new Hono<{
	Variables: {
		user:
			| NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]
			| null;
		session:
			| NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["session"]
			| null;
	};
}>()
	.use("*", async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });

		if (!session) {
			c.set("user", null);
			c.set("session", null);
			await next();
			return;
		}

		c.set("user", session.user);
		c.set("session", session.session);
		await next();
	})
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
	})
	.get("/session", (c) => {
		const session = c.get("session");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		return c.json({
			session,
			user,
		});
	});

// Full app with static serving
export const app = new Hono()
	.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))
	.route("/api", apiRoutes)
	.use("*", serveStatic({ root: "./static" }))
	.get("*", serveStatic({ path: "./static/index.html" }));

Bun.serve({
	fetch: app.fetch,
	port: process.env.PORT || 3000,
});

console.log(`Server running on port ${process.env.PORT || 3000}`);

export default app;
