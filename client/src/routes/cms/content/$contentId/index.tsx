import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Effect } from "effect";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentForm, getFormData } from "@/components/content/ContentForm";
import {
	useContent,
	useUpdateContent,
	useDeleteContent,
} from "@/lib/hooks/use-content";
import { serializeBlocks } from "@/components/editor/utils/serializer";
import type { Block } from "@/components/editor/hooks/use-editor-state";
import { toast } from "sonner";

export const Route = createFileRoute("/cms/content/$contentId/")({
	component: EditContentPage,
});

function EditContentPage() {
	const { contentId } = Route.useParams();
	const navigate = useNavigate();
	const { data: content, isLoading, error } = useContent(contentId);
	const updateContent = useUpdateContent(contentId);
	const deleteContent = useDeleteContent();
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	useEffect(() => {
		if (content?.blocks) {
			setBlocks(content.blocks as never);
		}
	}, [content]);

	const handleSave = async (
		e: React.FormEvent<HTMLFormElement>,
		status?: "draft" | "published"
	) => {
		e.preventDefault();
		setIsSaving(true);

		try {
			const formData = getFormData(e.currentTarget);
			const serializedBlocks = await Effect.runPromise(serializeBlocks(blocks));

			await updateContent.mutateAsync({
				title: formData.title,
				slug: formData.slug,
				blocks: serializedBlocks,
				contentType: formData.contentType,
				...(status ? { status } : {}),
				excerpt: formData.excerpt,
				metaTitle: formData.metaTitle,
				metaDescription: formData.metaDescription,
				ogImage: formData.ogImage,
			})

			toast.success("Content updated successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update content"
			)
		} finally {
			setIsSaving(false);
		}
	}

	const handleDelete = async () => {
		try {
			await deleteContent.mutateAsync(contentId);
			toast.success("Content deleted successfully");
			navigate({ to: "/cms/content" });
		} catch {
			toast.error("Failed to delete content");
		}
	}

	if (isLoading) {
		return (
			<div className="p-6 max-w-4xl mx-auto space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	if (error || !content) {
		return (
			<div className="p-6 max-w-4xl mx-auto">
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					Content not found or failed to load.
				</div>
			</div>
		)
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="mb-6">
				<Button variant="ghost" size="sm" asChild className="mb-4">
					<a href="/cms/content">
						<ArrowLeftIcon className="mr-2 h-4 w-4" />
						Back to Content
					</a>
				</Button>
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Edit Content</h1>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setShowDeleteDialog(true)}
					>
						<TrashIcon className="mr-2 h-4 w-4" />
						Delete
					</Button>
				</div>
			</div>

			<form onSubmit={(e) => handleSave(e)}>
				<ContentForm initialData={content} onBlocksChange={setBlocks}>
					<div className="flex items-center gap-2 mt-6 pt-6 border-t">
						<Button type="submit" disabled={isSaving}>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
						{content.status === "draft" && (
							<Button
								type="button"
								variant="default"
								disabled={isSaving}
								onClick={(e) => {
									const form = e.currentTarget.closest("form");
									if (form) {
										const event = new Event("submit", {
											bubbles: true,
											cancelable: true,
										})
										Object.defineProperty(event, "currentTarget", {
											value: form,
										})
										handleSave(
											event as unknown as React.FormEvent<HTMLFormElement>,
											"published"
										)
									}
								}}
							>
								Publish
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							disabled={isSaving}
							onClick={() => navigate({ to: "/cms/content" })}
						>
							Cancel
						</Button>
					</div>
				</ContentForm>
			</form>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Content</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{content.title}"? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteContent.isPending}
						>
							{deleteContent.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
