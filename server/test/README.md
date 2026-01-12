# Test Infrastructure

This directory contains the complete integration test infrastructure for the CMS server.

## Overview

- **Test Runner**: Vitest (Bun-compatible, fast, modern API)
- **Database**: Testcontainers with PostgreSQL 18-alpine
- **Architecture**: Effect-based services with dependency injection
- **Isolation**: Each test suite gets a fresh PostgreSQL container
- **Pattern**: Integration tests for services and routes

## Quick Start

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with UI
bun test:ui

# Generate coverage report
bun test:coverage

# Run specific test file
bun test TagService
```

## Directory Structure

```
test/
├── setup.ts                        # Global test setup with Testcontainers
├── helpers/
│   ├── db.ts                       # Database utilities (truncate, seed)
│   ├── factories.ts                # Test data factories
│   ├── runtime.ts                  # Effect test runtime
│   └── assertions.ts               # Custom assertions
├── fixtures/
│   ├── users.json                  # Seed data for users
│   ├── content.json                # Seed data for content
│   ├── tags.json                   # Seed data for tags
│   └── media.json                  # Seed data for media
└── integration/
    ├── services/
    │   └── TagService.test.ts      # Service integration tests
    └── routes/
        └── (future route tests)
```

## Test Infrastructure Components

### 1. Global Setup (`setup.ts`)

- Automatically starts PostgreSQL 18-alpine container before all tests
- Creates database schema (user, session, account, verification, tag, content, media)
- Exposes `getTestDb()` function for accessing test database
- Automatically cleans up container after all tests complete

**Key Features:**
- Random port assignment (no conflicts with dev database)
- 120-second startup timeout
- Waits for PostgreSQL ready message (appears twice)
- Automatic cleanup on test completion

### 2. Database Helpers (`helpers/db.ts`)

**`truncateAllTables(db)`**
- Fast cleanup between tests using `TRUNCATE ... RESTART IDENTITY CASCADE`
- Resets all tables to empty state
- Resets auto-increment counters

**`seedDatabase(db)`**
- Loads fixture data from JSON files
- Useful for tests requiring pre-populated data

### 3. Test Data Factories (`helpers/factories.ts`)

Generate realistic test data with sensible defaults and override capability:

**`userFactory`**
- `build()` - Create a writer user
- `buildAdmin()` - Create an admin user
- `buildEditor()` - Create an editor user
- `buildMany(count)` - Create multiple users

**`contentFactory`**
- `build()` - Create draft content
- `buildPublished(authorId)` - Create published content
- `buildScheduled(authorId, date)` - Create scheduled content
- `buildMany(count)` - Create multiple content items

**`tagFactory`**
- `build()` - Create a tag
- `buildMany(count)` - Create multiple tags

**`mediaFactory`**
- `build(uploadedBy)` - Create a media file
- `buildMany(uploadedBy, count)` - Create multiple media files

All factories support overrides:
```typescript
const user = userFactory.build({ name: "Custom Name", role: "admin" });
```

### 4. Effect Test Runtime (`helpers/runtime.ts`)

**`createTestRuntime(testDb)`**
- Creates Effect runtime with test database
- Mirrors production AppRuntime but with test database layer
- Provides all services: ContentService, UserService, TagService, MediaService, StatsService

**`runTestEffect(testDb, effect)`**
- Convenience function to execute Effect programs in tests
- Returns Promise with result

Example:
```typescript
const program = Effect.gen(function* () {
  const service = yield* TagService;
  return yield* service.list();
});

const result = await runTestEffect(testDb, program);
```

### 5. Custom Assertions (`helpers/assertions.ts`)

Type-safe assertions for domain objects:
- `assertContentShape(content)` - Validates content object structure
- `assertUserShape(user)` - Validates user object structure
- `assertTagShape(tag)` - Validates tag object structure
- `assertMediaShape(media)` - Validates media object structure

## Writing Tests

### Service Test Pattern

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { TagService } from "@server/services/TagService";
import { getTestDb } from "../../setup";
import { runTestEffect } from "../../helpers/runtime";
import { truncateAllTables } from "../../helpers/db";
import { tagFactory } from "../../helpers/factories";

describe("TagService", () => {
  beforeEach(async () => {
    await truncateAllTables(getTestDb());
  });

  it("should create a tag", async () => {
    const testDb = getTestDb();

    const program = Effect.gen(function* () {
      const service = yield* TagService;
      return yield* service.create({
        name: "TypeScript",
        slug: "typescript",
      });
    });

    const result = await runTestEffect(testDb, program);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("TypeScript");
  });
});
```

### Route Test Pattern (To Be Implemented)

```typescript
import { Hono } from "hono";
import contentRoutes from "@server/routes/content";
import { getTestDb } from "../../setup";
import { truncateAllTables } from "../../helpers/db";
import { userFactory, contentFactory } from "../../helpers/factories";

describe("Content Routes", () => {
  let app: Hono;

  beforeEach(async () => {
    await truncateAllTables(getTestDb());
    app = new Hono();
    app.route("/api/content", contentRoutes);
  });

  it("GET /api/content - should list content", async () => {
    const testDb = getTestDb();
    const user = await testDb.insertInto("user")
      .values(userFactory.build())
      .returningAll()
      .executeTakeFirstOrThrow();

    await testDb.insertInto("content")
      .values(contentFactory.build({ authorId: user.id }))
      .execute();

    const res = await app.request("/api/content");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## Test Fixtures

Fixtures provide realistic seed data for tests requiring pre-populated databases:

- `users.json` - Admin, editor, and writer users
- `content.json` - Sample published article
- `tags.json` - TypeScript, Effect, and Testing tags
- `media.json` - Sample image file

Load fixtures:
```typescript
import { seedDatabase } from "../helpers/db";
import { getTestDb } from "../setup";

await seedDatabase(getTestDb());
```

## Best Practices

### 1. Test Isolation
- Always use `beforeEach` with `truncateAllTables()`
- Each test should be independent and not rely on other tests

### 2. Use Factories
- Use factories instead of hardcoding test data
- Override only what's necessary for the test
- Factories ensure unique data (timestamps, random strings)

### 3. Effect Programs
- Write Effect programs just like production code
- Use `yield*` to access services
- Let Effect handle error propagation

### 4. Assertions
- Test behavior, not implementation
- Use `toHaveProperty()` for structure validation
- Test actual values for business logic

### 5. Descriptive Tests
- Use descriptive `describe` and `it` blocks
- Group related tests together
- One assertion concept per test

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run tests
  run: bun test
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bhvr_test
```

The CI environment has PostgreSQL service available, so Testcontainers will detect and use it.

## Troubleshooting

### Container Won't Start
- Check Docker is running
- Increase timeout in `setup.ts` (currently 120s)
- Check Docker disk space

### Tests Fail with "Connection terminated"
- Database schema not created properly
- Check `createSchema()` function in `setup.ts`
- Verify all required tables are created

### Tests are Slow
- Testcontainers need ~5-7 seconds to start PostgreSQL
- This is normal and only happens once per test run
- Container is reused across all test files

### Port Conflicts
- Testcontainers automatically assigns random ports
- No manual port management needed
- Completely isolated from dev database (port 2345)

## Next Steps

Implement additional tests:

1. **Service Tests**:
   - `ContentService.test.ts` - Full CRUD with filters, search
   - `UserService.test.ts` - User management operations
   - `MediaService.test.ts` - Media listing
   - `StatsService.test.ts` - Stats aggregation

2. **Route Tests**:
   - `content.test.ts` - All content endpoints
   - `users.test.ts` - User profile endpoints
   - `admin.test.ts` - Admin-only endpoints with auth
   - `tags.test.ts` - Tag management
   - `media.test.ts` - Media endpoints

3. **Coverage**:
   - Add coverage thresholds in `vitest.config.ts`
   - Target: 80% lines/functions, 70% branches

4. **Advanced Features**:
   - Mutation testing for critical business logic
   - Performance benchmarks
   - E2E tests for critical flows
