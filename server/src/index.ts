import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared";
import { testConnection, updateUserProfile } from "./db";
import { auth } from "./lib/auth";
import adminRoutes from "./routes/admin";
import contentRoutes from "./routes/content";
import mediaRoutes from "./routes/media";
import tagRoutes from "./routes/tags";
import userRoutes from "./routes/users";

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
	.route("/content", contentRoutes)
	.route("/users", userRoutes)
	.route("/admin", adminRoutes)
	.route("/content", contentRoutes)
	.route("/users", userRoutes)
	.route("/admin", adminRoutes)
	.route("/tags", tagRoutes)
	.route("/media", mediaRoutes)
	.route("/content", contentRoutes)
	.route("/users", userRoutes)
	.route("/admin", adminRoutes)
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
	})
	.patch("/user/profile", async (c) => {
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const body = await c.req.json();

		if (!body || typeof body !== "object") {
			return c.json({ error: "Invalid request body" }, 400);
		}

		const updates: {
			bio?: string | null;
			preferences?: Record<string, unknown> | null;
		} = {};

		if ("bio" in body) {
			updates.bio = body.bio === "" ? null : body.bio;
		}

		if ("preferences" in body && body.preferences !== undefined) {
			if (body.preferences === null) {
				updates.preferences = null;
			}
			if (typeof body.preferences === "object") {
				updates.preferences = body.preferences as Record<string, unknown>;
			} else {
				return c.json({ error: "preferences must be an object or null" }, 400);
			}
		}

		const success = await updateUserProfile(user.id, updates);

		if (!success) {
			return c.json({ error: "Failed to update profile" }, 500);
		}

		return c.json({ success: true, message: "Profile updated" });
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
