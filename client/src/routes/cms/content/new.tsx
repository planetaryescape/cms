import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Effect } from "effect";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentForm, getFormData } from "@/components/content/ContentForm";
import { useCreateContent } from "@/lib/hooks/use-content";
import { useSession } from "@/lib/auth-client";
import { serializeBlocks } from "@/components/editor/utils/serializer";
import type { Block } from "@/components/editor/hooks/use-editor-state";
import { toast } from "sonner";

export const Route = createFileRoute("/cms/content/new")({
	component: NewContentPage,
});

function NewContentPage() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const createContent = useCreateContent();
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async (e: React.FormEvent<HTMLFormElement>, status: "draft" | "published") => {
		e.preventDefault();
		if (!session?.user?.id) {
			toast.error("User not authenticated");
			return
		}

		setIsSaving(true);

		try {
			const formData = getFormData(e.currentTarget);
			const serializedBlocks = await Effect.runPromise(serializeBlocks(blocks));

			await createContent.mutateAsync({
				title: formData.title,
				slug: formData.slug,
				blocks: serializedBlocks,
				contentType: formData.contentType,
				status,
				excerpt: formData.excerpt,
				metaTitle: formData.metaTitle,
				metaDescription: formData.metaDescription,
				ogImage: formData.ogImage,
				authorId: session.user.id,
			})

			toast.success(`Content ${status === "draft" ? "saved as draft" : "published"} successfully`);
			navigate({ to: "/cms/content" });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save content"
			)
		} finally {
			setIsSaving(false);
		}
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
				<h1 className="text-2xl font-bold">New Content</h1>
			</div>

			<form onSubmit={(e) => handleSave(e, "draft")}>
				<ContentForm onBlocksChange={setBlocks}>
					<div className="flex items-center gap-2 mt-6 pt-6 border-t">
						<Button
							type="submit"
							disabled={isSaving}
							variant="outline"
						>
							{isSaving ? "Saving..." : "Save as Draft"}
						</Button>
						<Button
							type="button"
							disabled={isSaving}
							onClick={(e) => {
								const form = e.currentTarget.closest("form");
								if (form) {
									handleSave(
										new Event("submit") as unknown as React.FormEvent<HTMLFormElement>,
										"published"
									)
								}
							}}
						>
							{isSaving ? "Publishing..." : "Publish"}
						</Button>
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
		</div>
	)
}
