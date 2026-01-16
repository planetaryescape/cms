import { useState } from "react";
import { Effect } from "effect";
import {
	BoldIcon,
	ItalicIcon,
	Link2Icon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	ListIcon,
	ListOrderedIcon,
	QuoteIcon,
	CodeIcon,
	ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Commands } from "./utils/commands";
import { useSelection } from "./hooks/use-selection";
import type { Block } from "./hooks/use-editor-state";

interface EditorToolbarProps {
	activeBlock: Block | null;
	onConvertBlock: (type: Block["type"], attrs?: Record<string, unknown>) => void;
}

export function EditorToolbar({ activeBlock, onConvertBlock }: EditorToolbarProps) {
	const { isBold, isItalic, isLink, linkHref, isCollapsed } = useSelection();
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");

	const handleBold = () => {
		Effect.runPromise(Commands.bold);
	};

	const handleItalic = () => {
		Effect.runPromise(Commands.italic);
	};

	const handleLink = () => {
		if (isLink && linkHref) {
			Effect.runPromise(Commands.unlink);
		} else {
			setLinkUrl(linkHref || "");
			setShowLinkDialog(true);
		}
	};

	const handleLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (linkUrl) {
			Effect.runPromise(Commands.createLink(linkUrl));
		}
		setShowLinkDialog(false);
		setLinkUrl("");
	};

	const canFormat =
		activeBlock &&
		(activeBlock.type === "paragraph" ||
			activeBlock.type === "heading" ||
			activeBlock.type === "blockquote");

	return (
		<>
			<div className="border-b bg-background sticky top-0 z-10 p-2 flex items-center gap-1 flex-wrap">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleBold}
					disabled={!canFormat}
					data-active={isBold}
				>
					<BoldIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleItalic}
					disabled={!canFormat}
					data-active={isItalic}
				>
					<ItalicIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleLink}
					disabled={!canFormat || isCollapsed}
					data-active={isLink}
				>
					<Link2Icon className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("heading", { level: 1 })}
					title="Heading 1"
				>
					<Heading1Icon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("heading", { level: 2 })}
					title="Heading 2"
				>
					<Heading2Icon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("heading", { level: 3 })}
					title="Heading 3"
				>
					<Heading3Icon className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("bulletList", { items: [""] })}
					title="Bullet List"
				>
					<ListIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("orderedList", { items: [""] })}
					title="Numbered List"
				>
					<ListOrderedIcon className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("blockquote")}
					title="Quote"
				>
					<QuoteIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("code", { content: "", language: "text" })}
					title="Code Block"
				>
					<CodeIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onConvertBlock("image", { src: "" })}
					title="Image"
				>
					<ImageIcon className="h-4 w-4" />
				</Button>
			</div>

			<Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
				<DialogContent>
					<form onSubmit={handleLinkSubmit}>
						<DialogHeader>
							<DialogTitle>Insert Link</DialogTitle>
							<DialogDescription>
								Enter the URL for the selected text
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<Label htmlFor="link-url">URL</Label>
							<Input
								id="link-url"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								placeholder="https://example.com"
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowLinkDialog(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Insert</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
