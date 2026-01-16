import { useState } from "react";
import { ImageIcon } from "lucide-react";
import type { Block } from "../hooks/use-editor-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageBlockProps {
	block: Block;
	onUpdate: (attrs: Record<string, unknown>) => void;
	onEnter: () => void;
	onBackspace: () => void;
}

export function ImageBlock({ block, onUpdate, onEnter, onBackspace }: ImageBlockProps) {
	const [isEditing, setIsEditing] = useState(!block.attrs?.src);

	const src = (block.attrs?.src as string) || "";
	const alt = (block.attrs?.alt as string) || "";
	const caption = (block.attrs?.caption as string) || "";

	const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		onUpdate({
			src: formData.get("src") as string,
			alt: formData.get("alt") as string,
			caption: formData.get("caption") as string,
		});
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<div className="border rounded-lg p-4 bg-accent/50" data-block-id={block.id}>
				<form onSubmit={handleSave} className="space-y-3">
					<div>
						<Label htmlFor="image-src">Image URL</Label>
						<Input
							id="image-src"
							name="src"
							defaultValue={src}
							placeholder="https://example.com/image.jpg"
							required
						/>
					</div>
					<div>
						<Label htmlFor="image-alt">Alt Text</Label>
						<Input
							id="image-alt"
							name="alt"
							defaultValue={alt}
							placeholder="Description of the image"
						/>
					</div>
					<div>
						<Label htmlFor="image-caption">Caption</Label>
						<Input
							id="image-caption"
							name="caption"
							defaultValue={caption}
							placeholder="Optional caption"
						/>
					</div>
					<div className="flex gap-2">
						<Button type="submit" size="sm">
							Save
						</Button>
						{src && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								Cancel
							</Button>
						)}
					</div>
				</form>
			</div>
		);
	}

	return (
		<div
			className="group relative rounded-lg overflow-hidden"
			data-block-id={block.id}
			data-block-type="image"
		>
			<img src={src} alt={alt} className="w-full h-auto" />
			{caption && (
				<p className="text-sm text-muted-foreground text-center mt-2 px-4">
					{caption}
				</p>
			)}
			<Button
				variant="secondary"
				size="sm"
				className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={() => setIsEditing(true)}
			>
				Edit
			</Button>
		</div>
	);
}
