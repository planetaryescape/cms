// src/schemas/validators.ts
import { Schema as S } from "@effect/schema";
import type { ParseError } from "@effect/schema/ParseResult";
import { Effect, pipe } from "effect";
import * as Schemas from "./";

// =====================================================
// CUSTOM ERRORS
// =====================================================

class ValidationError extends Error {
	readonly _tag = "ValidationError";
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

class ContentValidationError extends Error {
	readonly _tag = "ContentValidationError";
	constructor(message: string) {
		super(message);
		this.name = "ContentValidationError";
	}
}

class AuthorizationError extends Error {
	readonly _tag = "AuthorizationError";
	constructor(message: string) {
		super(message);
		this.name = "AuthorizationError";
	}
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

export const validateUser = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.User)(data);
	});

export const validateUserInsert = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.UserInsert)(data);
	});

export const validateContent = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.Content)(data);
	});

export const validateContentInsert = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.ContentInsert)(data);
	});

export const validateContentUpdate = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.ContentUpdate)(data);
	});

export const validateTag = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.Tag)(data);
	});

export const validateMedia = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.Media)(data);
	});

export const validatePaginationParams = (data: unknown) =>
	Effect.gen(function* () {
		return yield* S.decodeUnknown(Schemas.PaginationParams)(data);
	});

// =====================================================
// CUSTOM VALIDATORS
// =====================================================

export const validateSlug = (slug: string): Effect.Effect<string, ParseError> =>
	pipe(
		S.decodeUnknown(
			pipe(S.String, S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), S.maxLength(255)),
		),
		(decode) => decode(slug),
	);

export const validateEmail = (
	email: string,
): Effect.Effect<string, ParseError> =>
	pipe(
		S.decodeUnknown(pipe(S.String, S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),
		(decode) => decode(email),
	);

export const validateHexColor = (
	color: string,
): Effect.Effect<string, ParseError> =>
	pipe(
		S.decodeUnknown(pipe(S.String, S.pattern(/^#[0-9A-Fa-f]{6}$/))),
		(decode) => decode(color),
	);

// =====================================================
// BUSINESS LOGIC VALIDATORS
// =====================================================

export const validateContentCanPublish = (content: Schemas.Content) =>
	Effect.gen(function* () {
		if (content.title.trim().length === 0) {
			return yield* Effect.fail(
				new ContentValidationError("Title cannot be empty"),
			);
		}

		if (content.blocks.length === 0) {
			return yield* Effect.fail(
				new ContentValidationError("Content must have at least one block"),
			);
		}

		return content;
	});

export const validateUserCanEdit = (
	userId: Schemas.UserId,
	content: Schemas.Content,
	userRole: Schemas.UserRole,
) =>
	Effect.gen(function* () {
		if (userRole === "admin") {
			return true;
		}

		if (content.authorId === userId) {
			return true;
		}

		if (userRole === "editor") {
			return true;
		}

		return yield* Effect.fail(
			new AuthorizationError("Unauthorized to edit this content"),
		);
	});
