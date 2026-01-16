import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	message: string;
	cause?: unknown;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
	message: string;
	field?: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	resource: string;
	id: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
	message: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	message: string;
}> {}
