import { Kysely, sql } from "kysely";
import type { Database } from "shared";
import { getTestDb } from "../setup";

export async function truncateAllTables(db: Kysely<Database>) {
	await sql`
    TRUNCATE TABLE
      verification,
      session,
      account,
      content,
      media,
      tag,
      "user"
    RESTART IDENTITY CASCADE
  `.execute(db);
}

export async function seedDatabase(db: Kysely<Database>) {
	const users = (await import("../fixtures/users.json")).default;
	const content = (await import("../fixtures/content.json")).default;
	const tags = (await import("../fixtures/tags.json")).default;

	await db
		.insertInto("user")
		.values(users as any)
		.execute();
	await db
		.insertInto("tag")
		.values(tags as any)
		.execute();
	await db
		.insertInto("content")
		.values(content as any)
		.execute();
}
