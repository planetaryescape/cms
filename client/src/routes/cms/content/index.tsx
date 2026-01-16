import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import type { ContentStatus, ContentType } from "shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useContentList, useDeleteContent } from "@/lib/hooks/use-content";
import { ContentFilters } from "@/components/content/ContentFilters";
import { ContentListItem } from "@/components/content/ContentListItem";
import { toast } from "sonner";

export const Route = createFileRoute("/cms/content/")({
	component: ContentListPage,
});

function ContentListPage() {
	const [status, setStatus] = useState<ContentStatus | undefined>();
	const [contentType, setContentType] = useState<ContentType | undefined>();
	const [search, setSearch] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: content, isLoading, error } = useContentList({
		status,
		contentType,
		search: search || undefined,
		limit: 20,
	})

	const deleteContent = useDeleteContent();

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			await deleteContent.mutateAsync(deleteId);
			toast.success("Content deleted successfully");
			setDeleteId(null);
		} catch {
			toast.error("Failed to delete content");
		}
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">Content</h1>
					<p className="text-muted-foreground">
						Manage your articles, updates, and other content.
					</p>
				</div>
				<Button asChild>
					<Link to="/cms/content/new">
						<PlusIcon className="mr-2 h-4 w-4" />
						New Content
					</Link>
				</Button>
			</div>

			<div className="mb-6">
				<ContentFilters
					status={status}
					contentType={contentType}
					search={search}
					onStatusChange={setStatus}
					onTypeChange={setContentType}
					onSearchChange={setSearch}
				/>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className="h-24 w-full" />
					))}
				</div>
			) : error ? (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					Failed to load content. Please try again.
				</div>
			) : !content?.length ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-muted-foreground mb-4">No content found.</p>
					<Button asChild>
						<Link to="/cms/content/new">
							<PlusIcon className="mr-2 h-4 w-4" />
							Create your first content
						</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					{content.map((item) => (
						<ContentListItem
							key={item.id}
							content={item}
							onDelete={setDeleteId}
						/>
					))}
				</div>
			)}

			<Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Content</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this content? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteId(null)}>
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
