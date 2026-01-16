import { useCallback, useEffect, useState } from "react";

export interface SelectionState {
	isCollapsed: boolean;
	isBold: boolean;
	isItalic: boolean;
	isCode: boolean;
	isLink: boolean;
	linkHref: string | null;
}

export function useSelection() {
	const [selectionState, setSelectionState] = useState<SelectionState>({
		isCollapsed: true,
		isBold: false,
		isItalic: false,
		isCode: false,
		isLink: false,
		linkHref: null,
	});

	const updateSelectionState = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			setSelectionState({
				isCollapsed: true,
				isBold: false,
				isItalic: false,
				isCode: false,
				isLink: false,
				linkHref: null,
			});
			return;
		}

		const isBold = document.queryCommandState("bold");
		const isItalic = document.queryCommandState("italic");

		let isCode = false;
		let isLink = false;
		let linkHref: string | null = null;

		const anchorNode = selection.anchorNode;
		if (anchorNode) {
			let node: Node | null = anchorNode;
			while (node && node.nodeType !== Node.ELEMENT_NODE) {
				node = node.parentNode;
			}
			if (node) {
				const element = node as Element;
				isCode = !!element.closest("code");
				const linkElement = element.closest("a");
				if (linkElement) {
					isLink = true;
					linkHref = linkElement.getAttribute("href");
				}
			}
		}

		setSelectionState({
			isCollapsed: selection.isCollapsed,
			isBold,
			isItalic,
			isCode,
			isLink,
			linkHref,
		});
	}, []);

	useEffect(() => {
		document.addEventListener("selectionchange", updateSelectionState);
		return () => {
			document.removeEventListener("selectionchange", updateSelectionState);
		};
	}, [updateSelectionState]);

	return {
		...selectionState,
		updateSelectionState,
	};
}
