import { useState, useEffect } from "react";
import { Effect } from "effect";
import type { Content, ContentInsert, ContentUpdate, ContentType } from "shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { serializeBlocks } from "@/components/editor/utils/serializer";
import { deserializeBlocks } from "@/components/editor/utils/deserializer";
import type { Block } from "@/components/editor/hooks/use-editor-state";

interface ContentFormProps {
	initialData?: Partial<Content>;
	onBlocksChange: (blocks: Block[]) => void;
	children?: React.ReactNode;
}

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const contentTypes: { value: ContentType; label: string }[] = [
	{ value: "article", label: "Article" },
	{ value: "update", label: "Update" },
	{ value: "review", label: "Review" },
	{ value: "doc", label: "Documentation" },
	{ value: "newsletter", label: "Newsletter" },
];

export function ContentForm({ initialData, onBlocksChange, children }: ContentFormProps) {
	const [title, setTitle] = useState(initialData?.title || "");
	const [slug, setSlug] = useState(initialData?.slug || "");
	const [contentType, setContentType] = useState<ContentType>(
		initialData?.contentType || "article"
	);
	const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
	const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
	const [metaDescription, setMetaDescription] = useState(
		initialData?.metaDescription || ""
	);
	const [ogImage, setOgImage] = useState(initialData?.ogImage || "");
	const [isSlugManual, setIsSlugManual] = useState(!!initialData?.slug);
	const [initialBlocks, setInitialBlocks] = useState<Block[] | undefined>();

	useEffect(() => {
		if (initialData?.blocks) {
			Effect.runPromise(
				deserializeBlocks(initialData.blocks).pipe(
					Effect.tap((blocks) =>
						Effect.sync(() => {
							setInitialBlocks(blocks);
						})
					)
				)
			);
		}
	}, [initialData?.blocks]);

	useEffect(() => {
		if (!isSlugManual && title) {
			setSlug(generateSlug(title));
		}
	}, [title, isSlugManual]);

	const handleSlugChange = (value: string) => {
		setSlug(value);
		setIsSlugManual(true);
	};

	return (
		<Tabs defaultValue="content" className="w-full">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger value="content">Content</TabsTrigger>
				<TabsTrigger value="settings">Settings</TabsTrigger>
				<TabsTrigger value="seo">SEO</TabsTrigger>
			</TabsList>

			<TabsContent value="content" className="space-y-4">
				<div>
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						name="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Enter content title..."
						required
						className="text-lg font-semibold"
					/>
				</div>

				<div>
					<Label htmlFor="slug">Slug</Label>
					<Input
						id="slug"
						name="slug"
						value={slug}
						onChange={(e) => handleSlugChange(e.target.value)}
						placeholder="content-url-slug"
						required
						pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
						title="Only lowercase letters, numbers, and hyphens"
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Auto-generated from title. Edit to customize.
					</p>
				</div>

				<div>
					<Label>Content</Label>
					<BlockEditor initialBlocks={initialBlocks} onChange={onBlocksChange} />
				</div>
			</TabsContent>

			<TabsContent value="settings" className="space-y-4">
				<div>
					<Label htmlFor="contentType">Content Type</Label>
					<Select
						name="contentType"
						value={contentType}
						onValueChange={(value) => setContentType(value as ContentType)}
					>
						<SelectTrigger id="contentType">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{contentTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label htmlFor="excerpt">Excerpt</Label>
					<Textarea
						id="excerpt"
						name="excerpt"
						value={excerpt}
						onChange={(e) => setExcerpt(e.target.value)}
						placeholder="Brief summary of the content..."
						rows={3}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Used in listings and previews
					</p>
				</div>
			</TabsContent>

			<TabsContent value="seo" className="space-y-4">
				<div>
					<Label htmlFor="metaTitle">Meta Title</Label>
					<Input
						id="metaTitle"
						name="metaTitle"
						value={metaTitle}
						onChange={(e) => setMetaTitle(e.target.value)}
						placeholder="SEO title (defaults to content title)"
						maxLength={60}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						{metaTitle.length}/60 characters
					</p>
				</div>

				<div>
					<Label htmlFor="metaDescription">Meta Description</Label>
					<Textarea
						id="metaDescription"
						name="metaDescription"
						value={metaDescription}
						onChange={(e) => setMetaDescription(e.target.value)}
						placeholder="SEO description"
						rows={3}
						maxLength={160}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						{metaDescription.length}/160 characters
					</p>
				</div>

				<div>
					<Label htmlFor="ogImage">Open Graph Image URL</Label>
					<Input
						id="ogImage"
						name="ogImage"
						value={ogImage}
						onChange={(e) => setOgImage(e.target.value)}
						placeholder="https://example.com/image.jpg"
						type="url"
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Image shown when shared on social media
					</p>
				</div>
			</TabsContent>

			{children}
		</Tabs>
	);
}

export function getFormData(form: HTMLFormElement) {
	const formData = new FormData(form);
	return {
		title: formData.get("title") as string,
		slug: formData.get("slug") as string,
		contentType: formData.get("contentType") as ContentType,
		excerpt: (formData.get("excerpt") as string) || null,
		metaTitle: (formData.get("metaTitle") as string) || null,
		metaDescription: (formData.get("metaDescription") as string) || null,
		ogImage: (formData.get("ogImage") as string) || null,
	};
}
