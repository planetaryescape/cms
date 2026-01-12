import { Effect } from "effect";
import { Hono } from "hono";
import type { UserUpdate } from "shared";
import type { auth } from "../lib/auth";
import { AppRuntime } from "../lib/runtime";
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

app.get("/me", async (c) => {
	const user = c.get("user");
	if (!user) return c.json({ error: "Unauthorized" }, 401);

	const program = Effect.gen(function* () {
		const service = yield* UserService;
		return yield* service.getById((user as any).id);
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.patch("/me", async (c) => {
	const user = c.get("user");
	if (!user) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json<UserUpdate>();
	const program = Effect.gen(function* () {
		const service = yield* UserService;
		return yield* service.update((user as any).id, body);
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.get("/:id", async (c) => {
	const id = c.req.param("id");
	const program = Effect.gen(function* () {
		const service = yield* UserService;
		return yield* service.getById(id);
	});

	const result = await AppRuntime.runPromise(program);
	if (!result) return c.json({ error: "User not found" }, 404);
	return c.json(result);
});

export default app;
