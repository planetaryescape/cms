import { Schema as S } from "@effect/schema";
import { UserRole } from "./enums";

type StandardValidator = {
	"~standard": {
		version: 1;
		vendor: string;
		validate: (
			input: unknown,
		) =>
			| { ok: true; value: unknown }
			| { ok: false; errors: Array<{ message: string }> };
	};
};

const createEffectValidator = <A, I>(
	schema: S.Schema<A, I>,
): StandardValidator => ({
	"~standard": {
		version: 1,
		vendor: "effect",
		validate: (input: unknown) => {
			try {
				const result = S.decodeUnknownSync(schema)(input);
				return { ok: true, value: result };
			} catch (_e) {
				return { ok: false, errors: [{ message: "validation failed" }] };
			}
		},
	},
});

export const additionalUserFields = {
	role: {
		type: ["admin", "editor", "writer", "viewer"],
		required: false,
		defaultValue: "viewer",
		input: false,
		validator: { input: createEffectValidator(UserRole) },
	},
	bio: {
		type: "string",
		required: false,
	},
	isActive: {
		type: "boolean",
		required: false,
		defaultValue: true,
	},
	preferences: {
		type: "string",
		required: false,
		defaultValue: "{}",
	},
} as any;
