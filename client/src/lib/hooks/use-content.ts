import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	Content,
	ContentInsert,
	ContentUpdate,
	ContentStatus,
	ContentType,
} from "shared";

interface ContentListFilters {
	status?: ContentStatus;
	contentType?: ContentType;
	search?: string;
	limit?: number;
	offset?: number;
}

async function fetchContentList(filters: ContentListFilters): Promise<Content[]> {
	const params = new URLSearchParams();
	if (filters.status) params.set("status", filters.status);
	if (filters.contentType) params.set("contentType", filters.contentType);
	if (filters.search) params.set("search", filters.search);
	if (filters.limit) params.set("limit", filters.limit.toString());
	if (filters.offset) params.set("offset", filters.offset.toString());

	const response = await fetch(`/api/content?${params.toString()}`);
	if (!response.ok) {
		throw new Error("Failed to fetch content list");
	}
	return response.json();
}

async function fetchContent(id: string): Promise<Content> {
	const response = await fetch(`/api/content/${id}`);
	if (!response.ok) {
		throw new Error("Failed to fetch content");
	}
	return response.json();
}

async function createContent(data: ContentInsert): Promise<Content> {
	const response = await fetch("/api/content", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Unknown error" }));
		throw new Error(error.error?.message || error.error || "Failed to create content");
	}
	return response.json();
}

async function updateContent(id: string, data: ContentUpdate): Promise<Content> {
	const response = await fetch(`/api/content/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Unknown error" }));
		throw new Error(error.error?.message || error.error || "Failed to update content");
	}
	return response.json();
}

async function deleteContent(id: string): Promise<void> {
	const response = await fetch(`/api/content/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete content");
	}
}

export function useContentList(filters: ContentListFilters = {}) {
	return useQuery({
		queryKey: ["content", "list", filters],
		queryFn: () => fetchContentList(filters),
	});
}

export function useContent(id: string) {
	return useQuery({
		queryKey: ["content", id],
		queryFn: () => fetchContent(id),
		enabled: !!id,
	});
}

export function useCreateContent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createContent,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["content", "list"] });
		},
	});
}

export function useUpdateContent(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: ContentUpdate) => updateContent(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["content", "list"] });
			queryClient.invalidateQueries({ queryKey: ["content", id] });
		},
	});
}

export function useDeleteContent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteContent,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["content", "list"] });
		},
	});
}
