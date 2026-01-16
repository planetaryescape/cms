import { useState, type KeyboardEvent } from "react";
import type { Block } from "../hooks/use-editor-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";

interface ListBlockProps {
	block: Block;
	onUpdate: (attrs: Record<string, unknown>) => void;
	onFocus: () => void;
}

export function ListBlock({ block, onUpdate, onFocus }: ListBlockProps) {
	const isOrdered = block.type === "orderedList";
	const items = (block.attrs?.items as string[]) || [""];
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const updateItem = (index: number, value: string) => {
		const newItems = [...items];
		newItems[index] = value;
		onUpdate({ ...block.attrs, items: newItems });
	};

	const addItem = () => {
		const newItems = [...items, ""];
		onUpdate({ ...block.attrs, items: newItems });
		setEditingIndex(newItems.length - 1);
	};

	const removeItem = (index: number) => {
		if (items.length === 1) return;
		const newItems = items.filter((_, i) => i !== index);
		onUpdate({ ...block.attrs, items: newItems });
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addItem();
		} else if (e.key === "Backspace" && !items[index]) {
			e.preventDefault();
			removeItem(index);
		}
	};

	const ListTag = isOrdered ? "ol" : "ul";
	const listClass = isOrdered
		? "list-decimal list-inside space-y-2"
		: "list-disc list-inside space-y-2";

	return (
		<div className="space-y-2" data-block-id={block.id} data-block-type={block.type}>
			<ListTag className={listClass}>
				{items.map((item, index) => (
					<li key={index} className="flex items-center gap-2 group">
						<Input
							value={item}
							onChange={(e) => updateItem(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(e, index)}
							onFocus={() => {
								onFocus();
								setEditingIndex(index);
							}}
							onBlur={() => setEditingIndex(null)}
							placeholder="List item..."
							className="flex-1 h-8"
						/>
						{items.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => removeItem(index)}
							>
								<XIcon className="h-4 w-4" />
							</Button>
						)}
					</li>
				))}
			</ListTag>
			<Button variant="outline" size="sm" onClick={addItem}>
				<PlusIcon className="mr-2 h-4 w-4" />
				Add Item
			</Button>
		</div>
	);
}
