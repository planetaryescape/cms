import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import type { Database } from "shared";

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString:
			process.env.DATABASE_URL ||
			"postgresql://postgres:postgres@localhost:2345/bhvr",
	}),
});

export const db = new Kysely<Database>({
	dialect,
});

export async function testConnection() {
	try {
		await sql`SELECT 1`.execute(db);
		return { success: true, message: "Database connection successful" };
	} catch (error) {
		return {
			success: false,
			message: "Database connection failed",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function updateUserProfile(
	userId: string,
	updates: {
		bio?: string | null;
		preferences?: Record<string, unknown> | null;
	},
) {
	const result = await db
		.updateTable("user")
		.set({
			bio: updates.bio ?? sql`"bio"`,
			preferences: updates.preferences
				? JSON.stringify(updates.preferences)
				: sql`"preferences"`,
		})
		.where("id", "=", userId)
		.execute();

	return result.length > 0;
}
