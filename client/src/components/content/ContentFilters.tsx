import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ContentStatus, ContentType } from "shared";

const statusOptions: { value: ContentStatus | "all"; label: string }[] = [
	{ value: "all", label: "All Statuses" },
	{ value: "draft", label: "Draft" },
	{ value: "published", label: "Published" },
	{ value: "archived", label: "Archived" },
	{ value: "scheduled", label: "Scheduled" },
];

const typeOptions: { value: ContentType | "all"; label: string }[] = [
	{ value: "all", label: "All Types" },
	{ value: "article", label: "Article" },
	{ value: "update", label: "Update" },
	{ value: "review", label: "Review" },
	{ value: "doc", label: "Documentation" },
	{ value: "newsletter", label: "Newsletter" },
];

interface ContentFiltersProps {
	status: ContentStatus | undefined;
	contentType: ContentType | undefined;
	search: string;
	onStatusChange: (status: ContentStatus | undefined) => void;
	onTypeChange: (type: ContentType | undefined) => void;
	onSearchChange: (search: string) => void;
}

export function ContentFilters({
	status,
	contentType,
	search,
	onStatusChange,
	onTypeChange,
	onSearchChange,
}: ContentFiltersProps) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<Input
				placeholder="Search by title..."
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				className="sm:max-w-xs"
			/>
			<Select
				value={status ?? "all"}
				onValueChange={(value) =>
					onStatusChange(value === "all" ? undefined : (value as ContentStatus))
				}
			>
				<SelectTrigger className="sm:w-40">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					{statusOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select
				value={contentType ?? "all"}
				onValueChange={(value) =>
					onTypeChange(value === "all" ? undefined : (value as ContentType))
				}
			>
				<SelectTrigger className="sm:w-40">
					<SelectValue placeholder="Type" />
				</SelectTrigger>
				<SelectContent>
					{typeOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
