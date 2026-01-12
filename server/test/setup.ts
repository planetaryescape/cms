import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";
import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import type { Database } from "shared";
import { afterAll, beforeAll } from "vitest";

let container: StartedTestContainer;
let testDb: Kysely<Database>;
let testPool: Pool;

export async function startTestDatabase() {
	container = await new GenericContainer("postgres:18-alpine")
		.withEnvironment({
			POSTGRES_USER: "test_user",
			POSTGRES_PASSWORD: "test_password",
			POSTGRES_DB: "cms_test",
		})
		.withExposedPorts(5432)
		.withWaitStrategy(
			Wait.forLogMessage(/database system is ready to accept connections/, 2),
		)
		.withStartupTimeout(120000)
		.start();

	const port = container.getMappedPort(5432);
	const connectionString = `postgresql://test_user:test_password@localhost:${port}/cms_test`;

	testPool = new Pool({ connectionString });
	testDb = new Kysely<Database>({
		dialect: new PostgresDialect({ pool: testPool }),
	});

	await createSchema(testDb);

	return { testDb, connectionString, port };
}

async function createSchema(db: Kysely<Database>) {
	await sql`
		CREATE TABLE IF NOT EXISTS "user" (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			"emailVerified" BOOLEAN NOT NULL DEFAULT false,
			name TEXT NOT NULL,
			image TEXT,
			role TEXT NOT NULL DEFAULT 'writer',
			bio TEXT,
			"isActive" BOOLEAN NOT NULL DEFAULT true,
			preferences JSONB NOT NULL DEFAULT '{}',
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS session (
			id TEXT PRIMARY KEY,
			"userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			token TEXT NOT NULL UNIQUE,
			"expiresAt" TIMESTAMP NOT NULL,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS account (
			id TEXT PRIMARY KEY,
			"userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			"accountId" TEXT NOT NULL,
			"providerId" TEXT NOT NULL,
			"accessToken" TEXT,
			"refreshToken" TEXT,
			"accessTokenExpiresAt" TIMESTAMP,
			"refreshTokenExpiresAt" TIMESTAMP,
			password TEXT,
			scope TEXT,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS verification (
			id TEXT PRIMARY KEY,
			identifier TEXT NOT NULL,
			value TEXT NOT NULL,
			"expiresAt" TIMESTAMP NOT NULL,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS tag (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			description TEXT,
			color TEXT,
			"usageCount" INTEGER NOT NULL DEFAULT 0,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS content (
			id TEXT PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			blocks JSONB NOT NULL,
			"contentType" TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft',
			excerpt TEXT,
			"metaTitle" TEXT,
			"metaDescription" TEXT,
			"ogImage" TEXT,
			"authorId" TEXT NOT NULL REFERENCES "user"(id),
			"publishedAt" TIMESTAMP,
			"scheduledFor" TIMESTAMP,
			"viewCount" INTEGER NOT NULL DEFAULT 0,
			"readingTimeMinutes" INTEGER,
			"wordCount" INTEGER,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"deletedAt" TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS media (
			id TEXT PRIMARY KEY,
			filename TEXT NOT NULL,
			"originalFilename" TEXT NOT NULL,
			"mimeType" TEXT NOT NULL,
			"storageProvider" TEXT NOT NULL,
			"storageKey" TEXT NOT NULL,
			"storageUrl" TEXT NOT NULL,
			"sizeBytes" INTEGER NOT NULL,
			width INTEGER,
			height INTEGER,
			"durationSeconds" REAL,
			blurhash TEXT,
			"dominantColor" TEXT,
			"altText" TEXT,
			caption TEXT,
			"uploadedBy" TEXT NOT NULL REFERENCES "user"(id),
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"deletedAt" TIMESTAMP
		);
	`.execute(db);
}

export async function stopTestDatabase() {
	if (testDb) {
		await testDb.destroy();
	}
	if (container) {
		await container.stop();
	}
}

export function getTestDb() {
	if (!testDb) throw new Error("Test database not initialized");
	return testDb;
}

beforeAll(async () => {
	await startTestDatabase();
}, 60000);

afterAll(async () => {
	await stopTestDatabase();
}, 30000);
