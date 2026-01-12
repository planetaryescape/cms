import { Effect } from "effect";
import { Hono } from "hono";
import type { ContentStatus, UserRole } from "shared";
import type { auth } from "../lib/auth";
import { AppRuntime } from "../lib/runtime";
import { ContentService } from "../services/ContentService";
import { StatsService } from "../services/StatsService";
import { UserService } from "../services/UserService";

const app = new Hono<{
	Variables: {
		user:
			| NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]
			| null;
		session:
			| NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["session"]
			| null;
	};
}>();

// Admin middleware - basic check
app.use("*", async (c, next) => {
	const user = c.get("user");
	if (!user || user.role !== "admin") {
		return c.json({ error: "Unauthorized: Admin access required" }, 403);
	}
	await next();
});

app.get("/stats", async (c) => {
	const program = Effect.gen(function* () {
		const service = yield* StatsService;
		return yield* service.getStats();
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.get("/users", async (c) => {
	const role = c.req.query("role") || undefined;
	const limitStr = c.req.query("limit");
	const offsetStr = c.req.query("offset");
	const limit = limitStr ? Number.parseInt(limitStr) : undefined;
	const offset = offsetStr ? Number.parseInt(offsetStr) : undefined;

	const program = Effect.gen(function* () {
		const service = yield* UserService;
		return yield* service.list({
			...(role ? { role: role as UserRole } : {}),
			...(limit ? { limit } : {}),
			...(offset ? { offset } : {}),
		});
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.patch("/content/:id/status", async (c) => {
	const id = c.req.param("id");
	const { status } = await c.req.json<{ status: string }>();

	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.update(id, { status: status as ContentStatus });
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

export default app;
