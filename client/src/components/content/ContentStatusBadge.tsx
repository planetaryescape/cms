import type { ContentStatus } from "shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<ContentStatus, { label: string; className: string }> = {
	draft: {
		label: "Draft",
		className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
	},
	published: {
		label: "Published",
		className: "bg-green-100 text-green-800 hover:bg-green-100",
	},
	archived: {
		label: "Archived",
		className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
	},
	scheduled: {
		label: "Scheduled",
		className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
	},
};

interface ContentStatusBadgeProps {
	status: ContentStatus;
}

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
	const config = statusConfig[status];
	return (
		<Badge variant="secondary" className={cn("font-medium", config.className)}>
			{config.label}
		</Badge>
	);
}
