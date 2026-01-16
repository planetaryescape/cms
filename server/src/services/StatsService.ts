import { Context, Effect, Layer } from "effect";
import { Database } from "./Database";
import { DatabaseError } from "../lib/errors";

export class StatsService extends Context.Tag("StatsService")<
	StatsService,
	{
		readonly getStats: () => Effect.Effect<
			{
				userCount: number;
				contentCount: number;
				mediaCount: number;
			},
			DatabaseError
		>;
	}
>() {}

export const StatsServiceLive = Layer.effect(
	StatsService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			getStats: () =>
				Effect.tryPromise({
					try: async () => {
						const [users, content, media] = await Promise.all([
							db
								.selectFrom("user")
								.select(db.fn.count("id").as("count"))
								.executeTakeFirst(),
							db
								.selectFrom("content")
								.select(db.fn.count("id").as("count"))
								.executeTakeFirst(),
							db
								.selectFrom("media")
								.select(db.fn.count("id").as("count"))
								.executeTakeFirst(),
						]);

						return {
							userCount: Number(users?.count ?? 0),
							contentCount: Number(content?.count ?? 0),
							mediaCount: Number(media?.count ?? 0),
						};
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to get stats: ${e}` }),
				}),
		};
	}),
);
