import { Link } from "@tanstack/react-router";
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";
import type { Content, ContentType } from "shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentStatusBadge } from "./ContentStatusBadge";

const typeLabels: Record<ContentType, string> = {
	article: "Article",
	update: "Update",
	review: "Review",
	doc: "Documentation",
	newsletter: "Newsletter",
};

interface ContentListItemProps {
	content: Content;
	onDelete: (id: string) => void;
}

export function ContentListItem({ content, onDelete }: ContentListItemProps) {
	const formattedDate = new Date(content.updatedAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Card className="transition-colors hover:bg-accent/50">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<Link
								to="/cms/content/$contentId"
								params={{ contentId: content.id }}
								className="text-base font-medium hover:underline truncate"
							>
								{content.title}
							</Link>
						</div>
						{content.excerpt && (
							<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
								{content.excerpt}
							</p>
						)}
						<div className="flex items-center gap-2 flex-wrap">
							<ContentStatusBadge status={content.status} />
							<Badge variant="outline">{typeLabels[content.contentType]}</Badge>
							<span className="text-xs text-muted-foreground">{formattedDate}</span>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
								<MoreHorizontalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link to="/cms/content/$contentId" params={{ contentId: content.id }}>
									<PencilIcon className="mr-2 h-4 w-4" />
									Edit
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => onDelete(content.id)}
							>
								<TrashIcon className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	);
}
