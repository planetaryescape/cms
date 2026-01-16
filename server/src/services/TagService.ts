import { Context, Effect, Layer } from "effect";
import type { Selectable } from "kysely";
import type { Database as DatabaseSchema } from "shared";
import { Database } from "./Database";
import { DatabaseError } from "../lib/errors";

type Tag = Selectable<DatabaseSchema["tag"]>;

export class TagService extends Context.Tag("TagService")<
	TagService,
	{
		readonly list: () => Effect.Effect<Tag[], DatabaseError>;
		readonly create: (input: {
			name: string;
			slug: string;
		}) => Effect.Effect<Tag, DatabaseError>;
	}
>() {}

export const TagServiceLive = Layer.effect(
	TagService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			list: () =>
				Effect.tryPromise({
					try: async () => {
						return await db.selectFrom("tag").selectAll().execute();
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to list tags: ${e}` }),
				}),
			create: (input) =>
				Effect.tryPromise({
					try: async () => {
						return await db
							.insertInto("tag")
							.values({
								...input,
								id: crypto.randomUUID(),
							})
							.returningAll()
							.executeTakeFirstOrThrow();
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to create tag: ${e}` }),
				}),
		};
	}),
);
