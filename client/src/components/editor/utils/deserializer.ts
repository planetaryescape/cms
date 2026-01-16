import { Effect, Array as EffectArray } from "effect";
import type { ContentBlock } from "shared";
import type { Block, InlineContent, TextMark } from "../hooks/use-editor-state";

export class DeserializationError {
	readonly _tag = "DeserializationError";
	constructor(readonly message: string) {}
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

const deserializeInlineContent = (
	content?: Array<{ type: string; text: string; marks?: Array<{ type: string; attrs?: Record<string, unknown> }> }>
): Effect.Effect<InlineContent[], DeserializationError> =>
	Effect.try({
		try: () => {
			if (!content) return [];
			return content.map((item) => ({
				type: "text" as const,
				text: item.text,
				marks: item.marks?.map((mark) => ({
					type: mark.type as TextMark["type"],
					attrs: mark.attrs as { href?: string; target?: string },
				})),
			}));
		},
		catch: (error) =>
			new DeserializationError(
				`Failed to deserialize inline content: ${error instanceof Error ? error.message : String(error)}`
			),
	});

const deserializeParagraphBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "paragraph") {
			return yield* Effect.fail(
				new DeserializationError("Expected paragraph block")
			);
		}
		const content = yield* deserializeInlineContent(block.content as never);
		return {
			id: generateId(),
			type: "paragraph",
			content,
		};
	});

const deserializeHeadingBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "heading") {
			return yield* Effect.fail(
				new DeserializationError("Expected heading block")
			);
		}
		const headingBlock = block as Extract<ContentBlock, { type: "heading" }>;
		const content = yield* deserializeInlineContent(headingBlock.content as never);
		return {
			id: generateId(),
			type: "heading",
			content,
			attrs: { level: headingBlock.attrs.level },
		};
	});

const deserializeImageBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "image") {
			return yield* Effect.fail(
				new DeserializationError("Expected image block")
			);
		}
		const imageBlock = block as Extract<ContentBlock, { type: "image" }>;
		return {
			id: generateId(),
			type: "image",
			attrs: {
				src: imageBlock.attrs.src,
				alt: imageBlock.attrs.alt,
				title: imageBlock.attrs.title,
				width: imageBlock.attrs.width,
				height: imageBlock.attrs.height,
				caption: imageBlock.attrs.caption,
			},
		};
	});

const deserializeCodeBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "code") {
			return yield* Effect.fail(
				new DeserializationError("Expected code block")
			);
		}
		const codeBlock = block as Extract<ContentBlock, { type: "code" }>;
		return {
			id: generateId(),
			type: "code",
			attrs: {
				language: codeBlock.attrs.language,
				filename: codeBlock.attrs.filename,
				content: codeBlock.content,
			},
		};
	});

const deserializeBlockquoteBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "blockquote") {
			return yield* Effect.fail(
				new DeserializationError("Expected blockquote block")
			);
		}
		const blockquoteBlock = block as Extract<ContentBlock, { type: "blockquote" }>;

		const firstParagraph = blockquoteBlock.content?.[0];
		const content = firstParagraph && "content" in firstParagraph
			? yield* deserializeInlineContent(firstParagraph.content as never)
			: [];

		return {
			id: generateId(),
			type: "blockquote",
			content,
		};
	});

const deserializeBulletListBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "bulletList") {
			return yield* Effect.fail(
				new DeserializationError("Expected bullet list block")
			);
		}
		const listBlock = block as Extract<ContentBlock, { type: "bulletList" }>;

		const items = listBlock.content.map((listItem) => {
			if ("content" in listItem && Array.isArray(listItem.content)) {
				const paragraph = listItem.content[0];
				if (paragraph && "content" in paragraph && Array.isArray(paragraph.content)) {
					return paragraph.content.map((c: { text: string }) => c.text).join("");
				}
			}
			return "";
		});

		return {
			id: generateId(),
			type: "bulletList",
			attrs: { items },
		};
	});

const deserializeOrderedListBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> =>
	Effect.gen(function* () {
		if (block.type !== "orderedList") {
			return yield* Effect.fail(
				new DeserializationError("Expected ordered list block")
			);
		}
		const listBlock = block as Extract<ContentBlock, { type: "orderedList" }>;

		const items = listBlock.content.map((listItem) => {
			if ("content" in listItem && Array.isArray(listItem.content)) {
				const paragraph = listItem.content[0];
				if (paragraph && "content" in paragraph && Array.isArray(paragraph.content)) {
					return paragraph.content.map((c: { text: string }) => c.text).join("");
				}
			}
			return "";
		});

		return {
			id: generateId(),
			type: "orderedList",
			attrs: {
				items,
				start: listBlock.attrs?.start,
			},
		};
	});

const deserializeBlock = (block: ContentBlock): Effect.Effect<Block, DeserializationError> => {
	switch (block.type) {
		case "paragraph":
			return deserializeParagraphBlock(block);
		case "heading":
			return deserializeHeadingBlock(block);
		case "image":
			return deserializeImageBlock(block);
		case "code":
			return deserializeCodeBlock(block);
		case "blockquote":
			return deserializeBlockquoteBlock(block);
		case "bulletList":
			return deserializeBulletListBlock(block);
		case "orderedList":
			return deserializeOrderedListBlock(block);
		default:
			return Effect.fail(
				new DeserializationError(`Unsupported block type: ${(block as ContentBlock).type}`)
			);
	}
};

export const deserializeBlocks = (
	contentBlocks: ContentBlock[]
): Effect.Effect<Block[], DeserializationError> =>
	Effect.gen(function* () {
		if (!contentBlocks || contentBlocks.length === 0) {
			return [
				{
					id: generateId(),
					type: "paragraph",
					content: [{ type: "text", text: "" }],
				},
			];
		}

		const blocks = yield* EffectArray.map(contentBlocks, (block) =>
			deserializeBlock(block)
		);
		return blocks;
	});
