import { Effect } from "effect";

export class EditorCommandError {
	readonly _tag = "EditorCommandError";
	constructor(readonly message: string) {}
}

export const Commands = {
	bold: Effect.try({
		try: () => {
			document.execCommand("bold", false);
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to execute bold command: ${error instanceof Error ? error.message : String(error)}`
			),
	}),

	italic: Effect.try({
		try: () => {
			document.execCommand("italic", false);
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to execute italic command: ${error instanceof Error ? error.message : String(error)}`
			),
	}),

	createLink: (href: string) =>
		Effect.try({
			try: () => {
				const selection = window.getSelection();
				if (!selection || selection.isCollapsed) {
					throw new Error("No text selected");
				}
				document.execCommand("createLink", false, href);
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to create link: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	unlink: Effect.try({
		try: () => {
			document.execCommand("unlink", false);
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to remove link: ${error instanceof Error ? error.message : String(error)}`
			),
	}),

	insertText: (text: string) =>
		Effect.try({
			try: () => {
				document.execCommand("insertText", false, text);
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to insert text: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	getSelection: Effect.try({
		try: () => {
			const selection = window.getSelection();
			if (!selection) {
				throw new Error("No selection available");
			}
			return selection;
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to get selection: ${error instanceof Error ? error.message : String(error)}`
			),
	}),

	saveSelection: Effect.try({
		try: () => {
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) {
				return null;
			}
			return selection.getRangeAt(0);
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to save selection: ${error instanceof Error ? error.message : String(error)}`
			),
	}),

	restoreSelection: (range: Range | null) =>
		Effect.try({
			try: () => {
				if (!range) return;
				const selection = window.getSelection();
				if (!selection) return;
				selection.removeAllRanges();
				selection.addRange(range);
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to restore selection: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	wrapInElement: (tagName: string, className?: string) =>
		Effect.try({
			try: () => {
				const selection = window.getSelection();
				if (!selection || selection.rangeCount === 0) {
					throw new Error("No selection");
				}

				const range = selection.getRangeAt(0);
				const element = document.createElement(tagName);
				if (className) {
					element.className = className;
				}

				range.surroundContents(element);
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to wrap selection: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	focusElement: (element: HTMLElement) =>
		Effect.try({
			try: () => {
				element.focus();
				const range = document.createRange();
				const selection = window.getSelection();
				if (!selection) return;

				range.selectNodeContents(element);
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to focus element: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	setCursorAtStart: (element: HTMLElement) =>
		Effect.try({
			try: () => {
				const range = document.createRange();
				const selection = window.getSelection();
				if (!selection) return;

				range.setStart(element, 0);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
				element.focus();
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to set cursor at start: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	setCursorAtEnd: (element: HTMLElement) =>
		Effect.try({
			try: () => {
				const range = document.createRange();
				const selection = window.getSelection();
				if (!selection) return;

				range.selectNodeContents(element);
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
				element.focus();
			},
			catch: (error) =>
				new EditorCommandError(
					`Failed to set cursor at end: ${error instanceof Error ? error.message : String(error)}`
				),
		}),

	getCursorPosition: Effect.try({
		try: () => {
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) {
				return { offset: 0, atStart: false, atEnd: false };
			}

			const range = selection.getRangeAt(0);
			const preCaretRange = range.cloneRange();
			const container = range.startContainer.parentElement;

			if (!container) {
				return { offset: 0, atStart: false, atEnd: false };
			}

			preCaretRange.selectNodeContents(container);
			preCaretRange.setEnd(range.startContainer, range.startOffset);

			const offset = preCaretRange.toString().length;
			const atStart = offset === 0;
			const atEnd = offset === container.textContent?.length;

			return { offset, atStart, atEnd };
		},
		catch: (error) =>
			new EditorCommandError(
				`Failed to get cursor position: ${error instanceof Error ? error.message : String(error)}`
			),
	}),
};
