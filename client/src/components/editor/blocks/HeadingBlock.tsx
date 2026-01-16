import { useRef, useEffect, type KeyboardEvent } from "react";
import { Effect } from "effect";
import type { Block, InlineContent } from "../hooks/use-editor-state";
import { Commands } from "../utils/commands";
import { cn } from "@/lib/utils";

interface HeadingBlockProps {
	block: Block;
	isActive: boolean;
	onContentChange: (content: InlineContent[]) => void;
	onEnter: () => void;
	onBackspace: () => void;
	onFocus: () => void;
	onArrowUp: () => void;
	onArrowDown: () => void;
}

const headingClasses: Record<number, string> = {
	1: "text-3xl font-bold",
	2: "text-2xl font-bold",
	3: "text-xl font-semibold",
	4: "text-lg font-semibold",
	5: "text-base font-semibold",
	6: "text-sm font-semibold",
};

export function HeadingBlock({
	block,
	isActive,
	onContentChange,
	onEnter,
	onBackspace,
	onFocus,
	onArrowUp,
	onArrowDown,
}: HeadingBlockProps) {
	const ref = useRef<HTMLDivElement>(null);
	const level = (block.attrs?.level as number) || 1;

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
		<div
			ref={ref}
			contentEditable
			suppressContentEditableWarning
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			onFocus={onFocus}
			className={cn(
				"outline-none py-1 px-2 rounded hover:bg-accent/50 focus:bg-accent/50 min-h-[1.5rem]",
				headingClasses[level] || headingClasses[1]
			)}
			data-block-id={block.id}
			data-block-type="heading"
			data-level={level}
		>
			{text}
		</div>
	);
}
