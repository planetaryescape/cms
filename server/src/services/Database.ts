import { Context, Layer } from "effect";
import { db } from "../db";

export class Database extends Context.Tag("Database")<Database, {
	readonly db: typeof db;
}>() {}

export const DatabaseLive = Layer.succeed(
	Database,
	Database.of({ db }),
);
