import { useEditorState, type Block, type InlineContent } from "./hooks/use-editor-state";
import { EditorToolbar } from "./EditorToolbar";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { BlockquoteBlock } from "./blocks/BlockquoteBlock";
import { ListBlock } from "./blocks/ListBlock";

interface BlockEditorProps {
	initialBlocks?: Block[];
	onChange?: (blocks: Block[]) => void;
}

export function BlockEditor({ initialBlocks, onChange }: BlockEditorProps) {
	const editor = useEditorState(initialBlocks);

	const handleBlockChange = (blockId: string, content: InlineContent[]) => {
		editor.updateBlockContent(blockId, content);
		onChange?.(editor.blocks);
	};

	const handleBlockUpdate = (blockId: string, attrs: Record<string, unknown>) => {
		editor.updateBlock(blockId, { attrs });
		onChange?.(editor.blocks);
	};

	const handleEnter = (blockId: string) => {
		editor.insertBlockAfter(blockId);
		onChange?.(editor.blocks);
	};

	const handleBackspace = (blockId: string) => {
		editor.mergeWithPrevious(blockId);
		onChange?.(editor.blocks);
	};

	const handleConvertActiveBlock = (type: Block["type"], attrs?: Record<string, unknown>) => {
		if (editor.activeBlockId) {
			editor.convertBlockType(editor.activeBlockId, type, attrs);
			onChange?.(editor.blocks);
		}
	};

	const renderBlock = (block: Block) => {
		const isActive = block.id === editor.activeBlockId;
		const commonProps = {
			block,
			isActive,
			onFocus: () => editor.setActiveBlock(block.id),
			onEnter: () => handleEnter(block.id),
			onBackspace: () => handleBackspace(block.id),
			onArrowUp: () => editor.focusPreviousBlock(block.id),
			onArrowDown: () => editor.focusNextBlock(block.id),
		};

		switch (block.type) {
			case "paragraph":
				return (
					<ParagraphBlock
						{...commonProps}
						onContentChange={(content) => handleBlockChange(block.id, content)}
					/>
				);
			case "heading":
				return (
					<HeadingBlock
						{...commonProps}
						onContentChange={(content) => handleBlockChange(block.id, content)}
					/>
				);
			case "code":
				return (
					<CodeBlock
						{...commonProps}
						onUpdate={(attrs) => handleBlockUpdate(block.id, attrs)}
					/>
				);
			case "image":
				return (
					<ImageBlock
						{...commonProps}
						onUpdate={(attrs) => handleBlockUpdate(block.id, attrs)}
					/>
				);
			case "blockquote":
				return (
					<BlockquoteBlock
						{...commonProps}
						onContentChange={(content) => handleBlockChange(block.id, content)}
					/>
				);
			case "bulletList":
			case "orderedList":
				return (
					<ListBlock
						block={block}
						onUpdate={(attrs) => handleBlockUpdate(block.id, attrs)}
						onFocus={() => editor.setActiveBlock(block.id)}
					/>
				);
			default:
				return null;
		}
	};

	const activeBlock = editor.blocks.find((b) => b.id === editor.activeBlockId) || null;

	return (
		<div className="border rounded-lg bg-background">
			<EditorToolbar
				activeBlock={activeBlock}
				onConvertBlock={handleConvertActiveBlock}
			/>
			<div className="p-4 space-y-2 min-h-[400px]">
				{editor.blocks.map((block) => (
					<div key={block.id}>{renderBlock(block)}</div>
				))}
			</div>
		</div>
	);
}
