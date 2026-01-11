import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely";
import { db } from "./index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrator = new Migrator({
	db,
	provider: new FileMigrationProvider({
		fs,
		path,
		migrationFolder: path.join(__dirname, "migrations"),
	}),
});

export async function migrateToLatest() {
	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`Migration "${it.migrationName}" executed successfully`);
		} else if (it.status === "Error") {
			console.error(`Migration "${it.migrationName}" failed`);
		}
	});

	if (error) {
		console.error("Migration failed");
		console.error(error);
		process.exit(1);
	}

	if (!results?.length) {
		console.log("No migrations to run");
	}
}

export async function migrateDown() {
	const { error, results } = await migrator.migrateDown();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`Migration "${it.migrationName}" reverted successfully`);
		} else if (it.status === "Error") {
			console.error(`Migration "${it.migrationName}" revert failed`);
		}
	});

	if (error) {
		console.error("Migration rollback failed");
		console.error(error);
		process.exit(1);
	}
}

export async function getMigrationStatus() {
	const migrations = await migrator.getMigrations();

	console.log("\nMigration Status:");
	console.log("─".repeat(50));

	for (const migration of migrations) {
		const status = migration.executedAt ? "✓ Applied" : "○ Pending";
		const date = migration.executedAt
			? ` (${migration.executedAt.toISOString()})`
			: "";
		console.log(`${status}: ${migration.name}${date}`);
	}

	console.log("─".repeat(50));
}
