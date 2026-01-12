import { Context, Effect, Layer } from "effect";
import type { User, UserUpdate } from "shared";
import { Database } from "./Database";

export class UserService extends Context.Tag("UserService")<
	UserService,
	{
		readonly getById: (id: string) => Effect.Effect<User | undefined, Error>;
		readonly getByEmail: (
			email: string,
		) => Effect.Effect<User | undefined, Error>;
		readonly update: (
			id: string,
			input: UserUpdate,
		) => Effect.Effect<User, Error>;
		readonly list: (params: {
			limit?: number;
			offset?: number;
			role?: string;
		}) => Effect.Effect<User[], Error>;
	}
>() {}

export const UserServiceLive = Layer.effect(
	UserService,
	Effect.gen(function* () {
		const { db } = yield* Database;

		return {
			getById: (id: string) =>
				Effect.tryPromise({
					try: async () => {
						return (await db
							.selectFrom("user")
							.selectAll()
							.where("id", "=", id)
							.executeTakeFirst()) as any as User | undefined;
					},
					catch: (e) => new Error(`Failed to get user by id: ${e}`),
				}),

			getByEmail: (email: string) =>
				Effect.tryPromise({
					try: async () => {
						return (await db
							.selectFrom("user")
							.selectAll()
							.where("email", "=", email)
							.executeTakeFirst()) as any as User | undefined;
					},
					catch: (e) => new Error(`Failed to get user by email: ${e}`),
				}),

			update: (id: string, input: UserUpdate) =>
				Effect.tryPromise({
					try: async () => {
						const updateData: any = { ...input };
						if (input.preferences) {
							updateData.preferences = JSON.stringify(input.preferences);
						}
						updateData.updatedAt = new Date();

						const user = await db
							.updateTable("user")
							.set(updateData)
							.where("id", "=", id)
							.returningAll()
							.executeTakeFirstOrThrow();
						return user as any as User;
					},
					catch: (e) => new Error(`Failed to update user: ${e}`),
				}),

			list: (params: { limit?: number; offset?: number; role?: string }) =>
				Effect.tryPromise({
					try: async () => {
						let query = db.selectFrom("user");

						if (params.role) {
							query = query.where("role", "=", params.role as any);
						}

						return (await query
							.selectAll()
							.limit(params.limit ?? 50)
							.offset(params.offset ?? 0)
							.orderBy("createdAt", "desc")
							.execute()) as any as User[];
					},
					catch: (e) => new Error(`Failed to list users: ${e}`),
				}),
		};
	}),
);
