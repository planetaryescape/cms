import { useRef, useEffect, type KeyboardEvent } from "react";
import { Effect } from "effect";
import type { Block, InlineContent } from "../hooks/use-editor-state";
import { Commands } from "../utils/commands";

interface BlockquoteBlockProps {
	block: Block;
	isActive: boolean;
	onContentChange: (content: InlineContent[]) => void;
	onEnter: () => void;
	onBackspace: () => void;
	onFocus: () => void;
	onArrowUp: () => void;
	onArrowDown: () => void;
}

export function BlockquoteBlock({
	block,
	isActive,
	onContentChange,
	onEnter,
	onBackspace,
	onFocus,
	onArrowUp,
	onArrowDown,
}: BlockquoteBlockProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isActive && ref.current && document.activeElement !== ref.current) {
			Effect.runPromise(Commands.focusElement(ref.current));
		}
	}, [isActive]);

	const handleInput = () => {
		if (!ref.current) return;
		const text = ref.current.textContent || "";
		onContentChange([{ type: "text", text }]);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onEnter();
		} else if (e.key === "Backspace") {
			if (!ref.current) return;
			Effect.runPromise(
				Commands.getCursorPosition.pipe(
					Effect.tap((position) =>
						Effect.sync(() => {
							if (position.atStart && ref.current?.textContent === "") {
								e.preventDefault();
								onBackspace();
							}
						})
					)
				)
			);
		} else if (e.key === "ArrowUp") {
			Effect.runPromise(
				Commands.getCursorPosition.pipe(
					Effect.tap((position) =>
						Effect.sync(() => {
							if (position.atStart) {
								e.preventDefault();
								onArrowUp();
							}
						})
					)
				)
			);
		} else if (e.key === "ArrowDown") {
			Effect.runPromise(
				Commands.getCursorPosition.pipe(
					Effect.tap((position) =>
						Effect.sync(() => {
							if (position.atEnd) {
								e.preventDefault();
								onArrowDown();
							}
						})
					)
				)
			);
		}
	};

	const text = block.content?.[0]?.text || "";

	return (
		<blockquote
			className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground"
			data-block-id={block.id}
			data-block-type="blockquote"
		>
			<div
				ref={ref}
				contentEditable
				suppressContentEditableWarning
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				onFocus={onFocus}
				className="outline-none min-h-[1.5rem]"
			>
				{text}
			</div>
		</blockquote>
	);
}
