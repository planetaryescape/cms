import { Effect } from "effect";
import { Hono } from "hono";
import { AppRuntime } from "../lib/runtime";
import { TagService } from "../services/TagService";

const app = new Hono();

app.get("/", async (c) => {
	const program = Effect.gen(function* () {
		const service = yield* TagService;
		return yield* service.list();
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.post("/", async (c) => {
	const body = await c.req.json<{ name: string; slug: string }>();
	const program = Effect.gen(function* () {
		const service = yield* TagService;
		return yield* service.create(body);
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result, 201);
});

export default app;
