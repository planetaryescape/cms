import { beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { TagService } from "@server/services/TagService";
import { getTestDb } from "../../setup";
import { runTestEffect } from "../../helpers/runtime";
import { truncateAllTables } from "../../helpers/db";
import { tagFactory } from "../../helpers/factories";
import { assertTagShape } from "../../helpers/assertions";

describe("TagService", () => {
	beforeEach(async () => {
		await truncateAllTables(getTestDb());
	});

	describe("list", () => {
		it("should return empty array when no tags exist", async () => {
			const testDb = getTestDb();

			const program = Effect.gen(function* () {
				const service = yield* TagService;
				return yield* service.list();
			});

			const result = await runTestEffect(testDb, program);

			expect(result).toEqual([]);
		});

		it("should return all tags", async () => {
			const testDb = getTestDb();

			const tag1 = tagFactory.build();
			const tag2 = tagFactory.build();

			await testDb.insertInto("tag").values([tag1, tag2]).execute();

			const program = Effect.gen(function* () {
				const service = yield* TagService;
				return yield* service.list();
			});

			const result = await runTestEffect(testDb, program);

			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("name");
			expect(result[0]).toHaveProperty("slug");
			const names = result.map((t) => t.name);
			expect(names).toContain(tag1.name);
			expect(names).toContain(tag2.name);
		});
	});

	describe("create", () => {
		it("should create a tag with valid data", async () => {
			const testDb = getTestDb();

			const tagData = {
				name: "TypeScript",
				slug: "typescript",
			};

			const program = Effect.gen(function* () {
				const service = yield* TagService;
				return yield* service.create(tagData);
			});

			const result = await runTestEffect(testDb, program);

			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("slug");
			expect(result).toHaveProperty("createdAt");
			expect(result.name).toBe(tagData.name);
			expect(result.slug).toBe(tagData.slug);
			expect(result.usageCount).toBe(0);
			expect(result.id).toBeTruthy();
		});

		it("should create tag with optional fields", async () => {
			const testDb = getTestDb();

			const tagData = {
				name: "Effect",
				slug: "effect",
				description: "Functional programming library",
				color: "#8B5CF6",
			};

			const program = Effect.gen(function* () {
				const service = yield* TagService;
				return yield* service.create(tagData);
			});

			const result = await runTestEffect(testDb, program);

			expect(result.description).toBe(tagData.description);
			expect(result.color).toBe(tagData.color);
		});

		it("should persist tag to database", async () => {
			const testDb = getTestDb();

			const tagData = {
				name: "Testing",
				slug: "testing",
			};

			const program = Effect.gen(function* () {
				const service = yield* TagService;
				return yield* service.create(tagData);
			});

			const created = await runTestEffect(testDb, program);

			const persisted = await testDb
				.selectFrom("tag")
				.selectAll()
				.where("id", "=", created.id)
				.executeTakeFirst();

			expect(persisted).toBeTruthy();
			expect(persisted?.name).toBe(tagData.name);
			expect(persisted?.slug).toBe(tagData.slug);
		});
	});
});
