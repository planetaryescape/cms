import { Context, Effect, Layer } from "effect";
import type { Media } from "shared";
import { Database } from "./Database";

export class MediaService extends Context.Tag("MediaService")<
	MediaService,
	{
		readonly list: () => Effect.Effect<Media[], Error>;
	}
>() {}

export const MediaServiceLive = Layer.effect(
	MediaService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			list: () =>
				Effect.tryPromise({
					try: async () => {
						return (await db
							.selectFrom("media")
							.selectAll()
							.execute()) as any as Media[];
					},
					catch: (e) => new Error(`Failed to list media: ${e}`),
				}),
		};
	}),
);
