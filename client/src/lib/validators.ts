import { Schema as S } from "@effect/schema";
import type { ParseError } from "@effect/schema/ParseResult";
import type { Effect } from "effect";

export const UserProfileUpdate = S.Struct({
	bio: S.optional(S.String),
	preferences: S.optional(
		S.Struct({
			theme: S.optional(S.Literal("light", "dark", "system")),
			notifications: S.optional(S.Boolean),
			language: S.optional(S.String),
		}),
	),
});

export type UserProfileUpdate = S.Schema.Type<typeof UserProfileUpdate>;

export const validateProfileUpdate = (
	input: unknown,
): Effect.Effect<UserProfileUpdate, ParseError> =>
	S.decodeUnknown(UserProfileUpdate)(input);

export const formatPreferences = (
	preferences: Record<string, unknown> | null | undefined,
): string => {
	if (!preferences) return "{}";
	return JSON.stringify(preferences, null, 2);
};

export const formatPreferencesFromString = (
	preferencesString: string | null | undefined,
): string => {
	if (!preferencesString) return "{}";
	try {
		const parsed = JSON.parse(preferencesString);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return "{}";
	}
};

export const parsePreferences = (
	json: string,
): Record<string, unknown> | null => {
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
};
