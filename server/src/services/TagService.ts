import { Context, Effect, Layer } from "effect";
import type { Tag } from "shared";
import { Database } from "./Database";

export class TagService extends Context.Tag("TagService")<
	TagService,
	{
		readonly list: () => Effect.Effect<Tag[], Error>;
		readonly create: (input: {
			name: string;
			slug: string;
		}) => Effect.Effect<Tag, Error>;
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
						return (await db
							.selectFrom("tag")
							.selectAll()
							.execute()) as any as Tag[];
					},
					catch: (e) => new Error(`Failed to list tags: ${e}`),
				}),
			create: (input) =>
				Effect.tryPromise({
					try: async () => {
						return (await db
							.insertInto("tag")
							.values({
								...input,
								id: crypto.randomUUID(),
							} as any)
							.returningAll()
							.executeTakeFirstOrThrow()) as any as Tag;
					},
					catch: (e) => new Error(`Failed to create tag: ${e}`),
				}),
		};
	}),
);
