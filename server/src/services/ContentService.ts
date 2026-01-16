import { Context, Effect, Layer } from "effect";
import type { Selectable } from "kysely";
import { sql } from "kysely";
import type {
	ContentInsert,
	ContentStatus,
	ContentType,
	ContentUpdate,
	Database as DatabaseSchema,
} from "shared";
import { Database } from "./Database";
import { DatabaseError } from "../lib/errors";

type Content = Selectable<DatabaseSchema["content"]>;

export class ContentService extends Context.Tag("ContentService")<
	ContentService,
	{
		readonly list: (params: {
			authorId?: string;
			status?: ContentStatus;
			contentType?: ContentType;
			search?: string;
			limit?: number;
			offset?: number;
		}) => Effect.Effect<Content[], DatabaseError>;
		readonly get: (
			idOrSlug: string,
		) => Effect.Effect<Content | undefined, DatabaseError>;
		readonly create: (
			input: ContentInsert,
		) => Effect.Effect<Content, DatabaseError>;
		readonly update: (
			id: string,
			input: ContentUpdate,
		) => Effect.Effect<Content, DatabaseError>;
		readonly delete: (id: string) => Effect.Effect<void, DatabaseError>;
	}
>() {}

export const ContentServiceLive = Layer.effect(
	ContentService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			list: (params: {
				authorId?: string;
				status?: ContentStatus;
				contentType?: ContentType;
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
							query = query.where("status", "=", params.status);
						}
						if (params.contentType) {
							query = query.where("contentType", "=", params.contentType);
						}
						if (params.search) {
							query = query.where((eb) =>
								eb.or([
									eb("title", "ilike", `%${params.search}%`),
									eb("excerpt", "ilike", `%${params.search}%`),
								]),
							);
						}

						return await query
							.selectAll()
							.limit(params.limit ?? 20)
							.offset(params.offset ?? 0)
							.orderBy("createdAt", "desc")
							.execute();
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to list content: ${e}` }),
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

						return await query.executeTakeFirst();
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to get content: ${e}` }),
				}),

			create: (input: ContentInsert) =>
				Effect.tryPromise({
					try: async () => {
						const content = await db
							.insertInto("content")
							.values({
								...input,
								id: crypto.randomUUID(),
								blocks: JSON.stringify(input.blocks),
								status: input.status ?? "draft",
							})
							.returningAll()
							.executeTakeFirstOrThrow();
						return content;
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to create content: ${e}` }),
				}),

			update: (id: string, input: ContentUpdate) =>
				Effect.tryPromise({
					try: async () => {
						const updateData: Record<string, unknown> = { ...input };
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
						return content;
					},
					catch: (e) =>
						new DatabaseError({ message: `Failed to update content: ${e}` }),
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
					catch: (e) =>
						new DatabaseError({ message: `Failed to delete content: ${e}` }),
				}),
		};
	}),
);
