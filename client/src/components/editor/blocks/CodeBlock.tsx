import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { Effect } from "effect";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github-dark.css";
import type { Block } from "../hooks/use-editor-state";
import { Commands } from "../utils/commands";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);

const languages = [
	{ value: "javascript", label: "JavaScript" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "python", label: "Python" },
	{ value: "text", label: "Plain Text" },
];

interface CodeBlockProps {
	block: Block;
	isActive: boolean;
	onUpdate: (attrs: Record<string, unknown>) => void;
	onEnter: () => void;
	onBackspace: () => void;
	onFocus: () => void;
	onArrowUp: () => void;
	onArrowDown: () => void;
}

export function CodeBlock({
	block,
	isActive,
	onUpdate,
	onEnter,
	onBackspace,
	onFocus,
	onArrowUp,
	onArrowDown,
}: CodeBlockProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [highlightedCode, setHighlightedCode] = useState("");

	const content = (block.attrs?.content as string) || "";
	const language = (block.attrs?.language as string) || "text";
	const filename = (block.attrs?.filename as string) || "";

	useEffect(() => {
		if (language !== "text") {
			try {
				const result = hljs.highlight(content, { language });
				setHighlightedCode(result.value);
			} catch {
				setHighlightedCode(content);
			}
		} else {
			setHighlightedCode(content);
		}
	}, [content, language]);

	useEffect(() => {
		if (isActive && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [isActive]);

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onUpdate({ ...block.attrs, content: e.target.value });
	};

	const handleLanguageChange = (value: string) => {
		onUpdate({ ...block.attrs, language: value });
	};

	const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onUpdate({ ...block.attrs, filename: e.target.value });
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const start = e.currentTarget.selectionStart;
			const end = e.currentTarget.selectionEnd;
			const newContent = content.substring(0, start) + "\t" + content.substring(end);
			onUpdate({ ...block.attrs, content: newContent });
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
						start + 1;
				}
			}, 0);
		} else if (e.key === "ArrowUp" && e.currentTarget.selectionStart === 0) {
			e.preventDefault();
			onArrowUp();
		} else if (
			e.key === "ArrowDown" &&
			e.currentTarget.selectionStart === content.length
		) {
			e.preventDefault();
			onArrowDown();
		}
	};

	return (
		<div
			className="rounded-lg border bg-muted overflow-hidden"
			data-block-id={block.id}
			data-block-type="code"
		>
			<div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
				<Input
					value={filename}
					onChange={handleFilenameChange}
					placeholder="Filename (optional)"
					className="h-7 text-xs flex-1 max-w-xs"
				/>
				<Select value={language} onValueChange={handleLanguageChange}>
					<SelectTrigger className="h-7 text-xs w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{languages.map((lang) => (
							<SelectItem key={lang.value} value={lang.value}>
								{lang.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="relative">
				<pre className="p-4 overflow-x-auto text-sm">
					<code
						dangerouslySetInnerHTML={{
							__html: highlightedCode || "&nbsp;",
						}}
					/>
				</pre>
				<textarea
					ref={textareaRef}
					value={content}
					onChange={handleInput}
					onKeyDown={handleKeyDown}
					onFocus={onFocus}
					className="absolute inset-0 p-4 bg-transparent text-transparent caret-white outline-none resize-none font-mono text-sm overflow-x-auto"
					spellCheck={false}
				/>
			</div>
		</div>
	);
}
