import { expect } from "vitest";

export function assertContentShape(content: unknown) {
	expect(content).toMatchObject({
		id: expect.any(String),
		slug: expect.any(String),
		title: expect.any(String),
		blocks: expect.any(Array),
		contentType: expect.stringMatching(
			/^(article|update|review|doc|newsletter)$/,
		),
		status: expect.stringMatching(/^(draft|published|archived|scheduled)$/),
		authorId: expect.any(String),
		createdAt: expect.any(Date),
		updatedAt: expect.any(Date),
	});
}

export function assertUserShape(user: unknown) {
	expect(user).toMatchObject({
		id: expect.any(String),
		email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
		name: expect.any(String),
		role: expect.stringMatching(/^(admin|editor|writer|viewer)$/),
		isActive: expect.any(Boolean),
		createdAt: expect.any(Date),
	});
}

export function assertTagShape(tag: unknown) {
	expect(tag).toMatchObject({
		id: expect.any(String),
		name: expect.any(String),
		slug: expect.any(String),
		usageCount: expect.any(Number),
		createdAt: expect.any(Date),
	});
}

export function assertMediaShape(media: unknown) {
	expect(media).toMatchObject({
		id: expect.any(String),
		filename: expect.any(String),
		mimeType: expect.any(String),
		storageProvider: expect.stringMatching(/^(s3|cloudflare|local)$/),
		sizeBytes: expect.any(Number),
		uploadedBy: expect.any(String),
		createdAt: expect.any(Date),
	});
}
