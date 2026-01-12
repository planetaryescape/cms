import { Effect, Layer, ManagedRuntime } from "effect";
import type { Kysely } from "kysely";
import type { Database as DatabaseType } from "shared";
import { ContentServiceLive } from "@server/services/ContentService";
import { Database } from "@server/services/Database";
import { MediaServiceLive } from "@server/services/MediaService";
import { StatsServiceLive } from "@server/services/StatsService";
import { TagServiceLive } from "@server/services/TagService";
import { UserServiceLive } from "@server/services/UserService";

export function createTestRuntime(testDb: Kysely<DatabaseType>) {
	const TestDatabaseLive = Layer.succeed(Database, Database.of({ db: testDb }));

	const TestAppLayer = Layer.mergeAll(
		TestDatabaseLive,
		ContentServiceLive,
		UserServiceLive,
		StatsServiceLive,
		TagServiceLive,
		MediaServiceLive,
	).pipe(Layer.provide(TestDatabaseLive));

	return ManagedRuntime.make(TestAppLayer);
}

export function runTestEffect<A, E>(
	testDb: Kysely<DatabaseType>,
	effect: Effect.Effect<A, E>,
): Promise<A> {
	const runtime = createTestRuntime(testDb);
	return runtime.runPromise(effect);
}
