import { useState, useCallback } from "react";

export interface TextMark {
	type: "bold" | "italic" | "code" | "strike" | "link";
	attrs?: { href?: string; target?: string };
}

export interface InlineContent {
	type: "text";
	text: string;
	marks?: TextMark[];
}

export interface Block {
	id: string;
	type:
		| "paragraph"
		| "heading"
		| "image"
		| "code"
		| "blockquote"
		| "bulletList"
		| "orderedList";
	content?: InlineContent[];
	attrs?: Record<string, unknown>;
}

export interface EditorSelection {
	blockIndex: number;
	anchorOffset: number;
	focusOffset: number;
}

export interface EditorState {
	blocks: Block[];
	selection: EditorSelection | null;
	activeBlockId: string | null;
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

function createEmptyParagraph(): Block {
	return {
		id: generateId(),
		type: "paragraph",
		content: [{ type: "text", text: "" }],
	};
}

export function useEditorState(initialBlocks?: Block[]) {
	const [state, setState] = useState<EditorState>(() => ({
		blocks:
			initialBlocks && initialBlocks.length > 0
				? initialBlocks
				: [createEmptyParagraph()],
		selection: null,
		activeBlockId: null,
	}));

	const setActiveBlock = useCallback((blockId: string | null) => {
		setState((prev) => ({ ...prev, activeBlockId: blockId }));
	}, []);

	const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
		setState((prev) => ({
			...prev,
			blocks: prev.blocks.map((block) =>
				block.id === blockId ? { ...block, ...updates } : block
			),
		}));
	}, []);

	const updateBlockContent = useCallback(
		(blockId: string, content: InlineContent[]) => {
			setState((prev) => ({
				...prev,
				blocks: prev.blocks.map((block) =>
					block.id === blockId ? { ...block, content } : block
				),
			}));
		},
		[]
	);

	const insertBlockAfter = useCallback(
		(afterBlockId: string, newBlock?: Block) => {
			setState((prev) => {
				const index = prev.blocks.findIndex((b) => b.id === afterBlockId);
				if (index === -1) return prev;

				const block = newBlock || createEmptyParagraph();
				const newBlocks = [...prev.blocks];
				newBlocks.splice(index + 1, 0, block);

				return {
					...prev,
					blocks: newBlocks,
					activeBlockId: block.id,
				};
			});
		},
		[]
	);

	const insertBlockBefore = useCallback(
		(beforeBlockId: string, newBlock?: Block) => {
			setState((prev) => {
				const index = prev.blocks.findIndex((b) => b.id === beforeBlockId);
				if (index === -1) return prev;

				const block = newBlock || createEmptyParagraph();
				const newBlocks = [...prev.blocks];
				newBlocks.splice(index, 0, block);

				return {
					...prev,
					blocks: newBlocks,
					activeBlockId: block.id,
				};
			});
		},
		[]
	);

	const deleteBlock = useCallback((blockId: string) => {
		setState((prev) => {
			if (prev.blocks.length <= 1) {
				return {
					...prev,
					blocks: [createEmptyParagraph()],
				};
			}

			const index = prev.blocks.findIndex((b) => b.id === blockId);
			const newBlocks = prev.blocks.filter((b) => b.id !== blockId);
			const newActiveIndex = Math.max(0, index - 1);

			return {
				...prev,
				blocks: newBlocks,
				activeBlockId: newBlocks[newActiveIndex]?.id ?? null,
			};
		});
	}, []);

	const mergeWithPrevious = useCallback((blockId: string) => {
		setState((prev) => {
			const index = prev.blocks.findIndex((b) => b.id === blockId);
			if (index <= 0) return prev;

			const currentBlock = prev.blocks[index];
			const previousBlock = prev.blocks[index - 1];

			if (!currentBlock || !previousBlock) return prev;
			if (
				currentBlock.type !== "paragraph" &&
				currentBlock.type !== "heading"
			) {
				return prev;
			}
			if (
				previousBlock.type !== "paragraph" &&
				previousBlock.type !== "heading"
			) {
				return prev;
			}

			const previousContent = previousBlock.content || [];
			const currentContent = currentBlock.content || [];
			const mergedContent = [...previousContent, ...currentContent];

			const newBlocks = prev.blocks
				.map((block, i) => {
					if (i === index - 1) {
						return { ...block, content: mergedContent };
					}
					return block;
				})
				.filter((_, i) => i !== index);

			return {
				...prev,
				blocks: newBlocks,
				activeBlockId: previousBlock.id,
			};
		});
	}, []);

	const convertBlockType = useCallback(
		(
			blockId: string,
			newType: Block["type"],
			attrs?: Record<string, unknown>
		) => {
			setState((prev) => ({
				...prev,
				blocks: prev.blocks.map((block) =>
					block.id === blockId
						? {
								...block,
								type: newType,
								attrs: attrs || block.attrs,
								content:
									newType === "code"
										? undefined
										: block.content || [{ type: "text", text: "" }],
							}
						: block
				),
			}));
		},
		[]
	);

	const moveBlockUp = useCallback((blockId: string) => {
		setState((prev) => {
			const index = prev.blocks.findIndex((b) => b.id === blockId);
			if (index <= 0) return prev;

			const newBlocks = [...prev.blocks];
			[newBlocks[index - 1], newBlocks[index]] = [
				newBlocks[index],
				newBlocks[index - 1],
			];

			return { ...prev, blocks: newBlocks };
		});
	}, []);

	const moveBlockDown = useCallback((blockId: string) => {
		setState((prev) => {
			const index = prev.blocks.findIndex((b) => b.id === blockId);
			if (index === -1 || index >= prev.blocks.length - 1) return prev;

			const newBlocks = [...prev.blocks];
			[newBlocks[index], newBlocks[index + 1]] = [
				newBlocks[index + 1],
				newBlocks[index],
			];

			return { ...prev, blocks: newBlocks };
		});
	}, []);

	const setBlocks = useCallback((blocks: Block[]) => {
		setState((prev) => ({
			...prev,
			blocks: blocks.length > 0 ? blocks : [createEmptyParagraph()],
		}));
	}, []);

	const focusBlock = useCallback((blockId: string) => {
		setState((prev) => ({ ...prev, activeBlockId: blockId }));
	}, []);

	const focusPreviousBlock = useCallback((currentBlockId: string) => {
		setState((prev) => {
			const index = prev.blocks.findIndex((b) => b.id === currentBlockId);
			if (index <= 0) return prev;
			return { ...prev, activeBlockId: prev.blocks[index - 1]?.id ?? null };
		});
	}, []);

	const focusNextBlock = useCallback((currentBlockId: string) => {
		setState((prev) => {
			const index = prev.blocks.findIndex((b) => b.id === currentBlockId);
			if (index === -1 || index >= prev.blocks.length - 1) return prev;
			return { ...prev, activeBlockId: prev.blocks[index + 1]?.id ?? null };
		});
	}, []);

	return {
		blocks: state.blocks,
		activeBlockId: state.activeBlockId,
		setActiveBlock,
		updateBlock,
		updateBlockContent,
		insertBlockAfter,
		insertBlockBefore,
		deleteBlock,
		mergeWithPrevious,
		convertBlockType,
		moveBlockUp,
		moveBlockDown,
		setBlocks,
		focusBlock,
		focusPreviousBlock,
		focusNextBlock,
	};
}
