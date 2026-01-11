import { execSync } from "node:child_process";
import { getMigrationStatus, migrateDown, migrateToLatest } from "./migrator";
import { db } from "./index";

const command = process.argv[2];

async function runBetterAuthMigrations() {
	console.log("\n🔐 Running Better Auth migrations...");
	try {
		execSync("bunx @better-auth/cli migrate --config src/lib/auth.ts -y", {
			stdio: "inherit",
			cwd: process.cwd(),
		});
		console.log("✓ Better Auth migrations complete\n");
	} catch (error) {
		console.error("Better Auth migration failed");
		throw error;
	}
}

async function main() {
	try {
		switch (command) {
			case "up":
			case "latest":
				await runBetterAuthMigrations();
				console.log("📦 Running Kysely migrations...");
				await migrateToLatest();
				break;

			case "down":
				console.log("📦 Rolling back last Kysely migration...");
				await migrateDown();
				break;

			case "status":
				await getMigrationStatus();
				break;

			case "auth":
				await runBetterAuthMigrations();
				break;

			default:
				console.log(`
Database Migration CLI

Usage: bun run migrate <command>

Commands:
  up, latest    Run Better Auth + Kysely migrations
  down          Rollback last Kysely migration
  status        Show migration status
  auth          Run only Better Auth migrations
`);
				break;
		}
	} finally {
		await db.destroy();
	}
}

main();
