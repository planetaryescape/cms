import { Effect, Array as EffectArray } from "effect";
import type { ContentBlock } from "shared";
import type { Block, InlineContent } from "../hooks/use-editor-state";

export class SerializationError {
	readonly _tag = "SerializationError";
	constructor(readonly message: string) {}
}

const serializeInlineContent = (
	content: InlineContent[]
): Effect.Effect<
	Array<{ type: "text"; text: string; marks?: Array<{ type: string; attrs?: Record<string, unknown> }> }>,
	SerializationError
> =>
	Effect.try({
		try: () =>
			content.map((item) => ({
				type: "text" as const,
				text: item.text,
				marks: item.marks?.map((mark) => ({
					type: mark.type,
					attrs: mark.attrs,
				})),
			})),
		catch: (error) =>
			new SerializationError(
				`Failed to serialize inline content: ${error instanceof Error ? error.message : String(error)}`
			),
	});

const serializeParagraphBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		const content = yield* serializeInlineContent(block.content || []);
		return {
			type: "paragraph" as const,
			content,
		};
	});

const serializeHeadingBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		if (!block.attrs?.level || typeof block.attrs.level !== "number") {
			return yield* Effect.fail(
				new SerializationError("Heading block missing level attribute")
			);
		}
		const content = yield* serializeInlineContent(block.content || []);
		return {
			type: "heading" as const,
			attrs: { level: block.attrs.level as 1 | 2 | 3 | 4 | 5 | 6 },
			content,
		};
	});

const serializeImageBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		if (!block.attrs?.src || typeof block.attrs.src !== "string") {
			return yield* Effect.fail(
				new SerializationError("Image block missing src attribute")
			);
		}
		return {
			type: "image" as const,
			attrs: {
				src: block.attrs.src,
				alt: typeof block.attrs.alt === "string" ? block.attrs.alt : undefined,
				title: typeof block.attrs.title === "string" ? block.attrs.title : undefined,
				width: typeof block.attrs.width === "number" ? block.attrs.width : undefined,
				height: typeof block.attrs.height === "number" ? block.attrs.height : undefined,
				caption: typeof block.attrs.caption === "string" ? block.attrs.caption : undefined,
			},
		};
	});

const serializeCodeBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		const content = typeof block.attrs?.content === "string"
			? block.attrs.content
			: "";

		return {
			type: "code" as const,
			attrs: {
				language: typeof block.attrs?.language === "string" ? block.attrs.language : undefined,
				filename: typeof block.attrs?.filename === "string" ? block.attrs.filename : undefined,
			},
			content,
		};
	});

const serializeBlockquoteBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		const content = yield* serializeInlineContent(block.content || []);
		return {
			type: "blockquote" as const,
			content: [
				{
					type: "paragraph" as const,
					content,
				},
			],
		};
	});

const serializeBulletListBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		const items = block.attrs?.items;
		if (!Array.isArray(items)) {
			return yield* Effect.fail(
				new SerializationError("Bullet list block missing items")
			);
		}

		return {
			type: "bulletList" as const,
			content: items.map((item: string) => ({
				type: "listItem" as const,
				content: [
					{
						type: "paragraph" as const,
						content: [{ type: "text" as const, text: item }],
					},
				],
			})),
		};
	});

const serializeOrderedListBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> =>
	Effect.gen(function* () {
		const items = block.attrs?.items;
		if (!Array.isArray(items)) {
			return yield* Effect.fail(
				new SerializationError("Ordered list block missing items")
			);
		}

		return {
			type: "orderedList" as const,
			attrs: {
				start: typeof block.attrs?.start === "number" ? block.attrs.start : undefined,
			},
			content: items.map((item: string) => ({
				type: "listItem" as const,
				content: [
					{
						type: "paragraph" as const,
						content: [{ type: "text" as const, text: item }],
					},
				],
			})),
		};
	});

const serializeBlock = (block: Block): Effect.Effect<ContentBlock, SerializationError> => {
	switch (block.type) {
		case "paragraph":
			return serializeParagraphBlock(block);
		case "heading":
			return serializeHeadingBlock(block);
		case "image":
			return serializeImageBlock(block);
		case "code":
			return serializeCodeBlock(block);
		case "blockquote":
			return serializeBlockquoteBlock(block);
		case "bulletList":
			return serializeBulletListBlock(block);
		case "orderedList":
			return serializeOrderedListBlock(block);
		default:
			return Effect.fail(
				new SerializationError(`Unknown block type: ${(block as Block).type}`)
			);
	}
};

export const serializeBlocks = (
	blocks: Block[]
): Effect.Effect<ContentBlock[], SerializationError> =>
	Effect.gen(function* () {
		const serializedBlocks = yield* EffectArray.map(blocks, (block) =>
			serializeBlock(block)
		);
		return serializedBlocks;
	});
