import { Context, Effect, Layer } from "effect";
import { sql } from "kysely";
import type { Content, ContentInsert, ContentUpdate } from "shared";
import { Database } from "./Database";

export class ContentService extends Context.Tag("ContentService")<
	ContentService,
	{
		readonly list: (params: {
			authorId?: string;
			status?: string;
			contentType?: string;
			search?: string;
			limit?: number;
			offset?: number;
		}) => Effect.Effect<Content[], Error>;
		readonly get: (idOrSlug: string) => Effect.Effect<Content | undefined, Error>;
		readonly create: (input: ContentInsert) => Effect.Effect<Content, Error>;
		readonly update: (
			id: string,
			input: ContentUpdate,
		) => Effect.Effect<Content, Error>;
		readonly delete: (id: string) => Effect.Effect<void, Error>;
	}
>() {}

export const ContentServiceLive = Layer.effect(
	ContentService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			list: (params: {
				authorId?: string;
				status?: string;
				contentType?: string;
				search?: string;
				limit?: number;
				offset?: number;
			}) =>
				Effect.tryPromise({
					try: async () => {
						let query = db.selectFrom("content");

						if (params.authorId) {
							query = query.where("authorId", "=", params.authorId);
						}
						if (params.status) {
							query = query.where("status", "=", params.status as any);
						}
						if (params.contentType) {
							query = query.where(
								"contentType",
								"=",
								params.contentType as any,
							);
						}
						if (params.search) {
							query = query.where((eb: any) =>
								eb.or([
									eb("title", "ilike", `%${params.search}%`),
									eb("excerpt", "ilike", `%${params.search}%`),
								]),
							);
						}

						return (await query
							.selectAll()
							.limit(params.limit ?? 20)
							.offset(params.offset ?? 0)
							.orderBy("createdAt", "desc")
							.execute()) as any as Content[];
					},
					catch: (e) => new Error(`Failed to list content: ${e}`),
				}),

			get: (idOrSlug: string) =>
				Effect.tryPromise({
					try: async () => {
						const isUuid =
							/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
								idOrSlug,
							);
						let query = db.selectFrom("content").selectAll();

						if (isUuid) {
							query = query.where("id", "=", idOrSlug);
						} else {
							query = query.where("slug", "=", idOrSlug);
						}

						return (await query.executeTakeFirst()) as any as Content | undefined;
					},
					catch: (e) => new Error(`Failed to get content: ${e}`),
				}),

			create: (input: ContentInsert) =>
				Effect.tryPromise({
					try: async () => {
						const content = await db
							.insertInto("content")
							.values({
								...input,
								id: crypto.randomUUID(),
								blocks: JSON.stringify(input.blocks) as any,
								status: input.status ?? "draft",
							} as any)
							.returningAll()
							.executeTakeFirstOrThrow();
						return content as any as Content;
					},
					catch: (e) => new Error(`Failed to create content: ${e}`),
				}),

			update: (id: string, input: ContentUpdate) =>
				Effect.tryPromise({
					try: async () => {
						const updateData: any = { ...input };
						if (input.blocks) {
							updateData.blocks = JSON.stringify(input.blocks);
						}
						updateData.updatedAt = new Date();

						const content = await db
							.updateTable("content")
							.set(updateData)
							.where("id", "=", id)
							.returningAll()
							.executeTakeFirstOrThrow();
						return content as any as Content;
					},
					catch: (e) => new Error(`Failed to update content: ${e}`),
				}),

			delete: (id: string) =>
				Effect.tryPromise({
					try: async () => {
						await db
							.updateTable("content")
							.set({ deletedAt: new Date(), status: "archived" })
							.where("id", "=", id)
							.execute();
					},
					catch: (e) => new Error(`Failed to delete content: ${e}`),
				}),
		};
	}),
);
