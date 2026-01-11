// src/example-usage.ts
import { Effect, pipe } from "effect";
import type * as S from "./";
import * as V from "./validators";

// Example: Creating a new content
const createContent = (data: unknown) =>
	Effect.gen(function* () {
		// Validate input
		const contentInsert = yield* V.validateContentInsert(data);

		// Additional business logic validation
		// ... (database operations, etc.)

		return contentInsert;
	});

// Example: Updating content with authorization
const updateContent = (
	contentId: S.ContentId,
	userId: S.UserId,
	userRole: S.UserRole,
	updates: unknown,
) =>
	Effect.gen(function* () {
		// Validate updates
		const validUpdates = yield* V.validateContentUpdate(updates);

		// Fetch existing content (pseudo-code)
		// const existingContent = yield* _(fetchContentById(contentId));

		// Check authorization
		// yield* _(V.validateUserCanEdit(userId, existingContent, userRole));

		// Apply updates and save
		// ...

		return validUpdates;
	});

// Example: Parse and validate from API request
const handleApiRequest = (body: unknown) =>
	pipe(
		V.validateContentInsert(body),
		Effect.mapError((error) => ({
			code: "VALIDATION_ERROR",
			message: "Invalid request body",
			details: error,
		})),
	);
