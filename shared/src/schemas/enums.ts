import { Schema as S } from "@effect/schema";

export const UserRole = S.Literal("admin", "editor", "writer", "viewer");
export type UserRole = S.Schema.Type<typeof UserRole>;

export const ContentStatus = S.Literal(
	"draft",
	"published",
	"archived",
	"scheduled",
);
export type ContentStatus = S.Schema.Type<typeof ContentStatus>;

export const ContentType = S.Literal(
	"article",
	"update",
	"review",
	"doc",
	"newsletter",
);
export type ContentType = S.Schema.Type<typeof ContentType>;

export const StorageProvider = S.Literal("s3", "cloudflare", "local");
export type StorageProvider = S.Schema.Type<typeof StorageProvider>;
