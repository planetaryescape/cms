import { Effect } from "effect";
import { Hono } from "hono";
import type { ContentInsert, ContentUpdate } from "shared";
import { AppRuntime } from "../lib/runtime";
import { ContentService } from "../services/ContentService";

const app = new Hono();

app.get("/", async (c) => {
	const authorId = c.req.query("authorId") || undefined;
	const status = c.req.query("status") || undefined;
	const contentType = c.req.query("contentType") || undefined;
	const search = c.req.query("search") || undefined;
	const limitStr = c.req.query("limit");
	const offsetStr = c.req.query("offset");
	const limit = limitStr ? Number.parseInt(limitStr) : undefined;
	const offset = offsetStr ? Number.parseInt(offsetStr) : undefined;

	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.list({
			...(authorId ? { authorId } : {}),
			...(status ? { status } : {}),
			...(contentType ? { contentType } : {}),
			...(search ? { search } : {}),
			...(limit ? { limit } : {}),
			...(offset ? { offset } : {}),
		});
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.get("/:idOrSlug", async (c) => {
	const idOrSlug = c.req.param("idOrSlug");
	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.get(idOrSlug);
	});

	const result = await AppRuntime.runPromise(program);
	if (!result) return c.json({ error: "Not found" }, 404);
	return c.json(result);
});

app.post("/", async (c) => {
	const body = await c.req.json<ContentInsert>();
	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.create(body);
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result, 201);
});

app.patch("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json<ContentUpdate>();
	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.update(id, body);
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

app.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const program = Effect.gen(function* () {
		const service = yield* ContentService;
		return yield* service.delete(id);
	});

	await AppRuntime.runPromise(program);
	return c.json({ success: true });
});

export default app;
