import { Effect } from "effect";
import { Hono } from "hono";
import { AppRuntime } from "../lib/runtime";
import { MediaService } from "../services/MediaService";

const app = new Hono();

app.get("/", async (c) => {
	const program = Effect.gen(function* () {
		const service = yield* MediaService;
		return yield* service.list();
	});

	const result = await AppRuntime.runPromise(program);
	return c.json(result);
});

export default app;
