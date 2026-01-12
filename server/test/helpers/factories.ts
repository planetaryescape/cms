import type { NewContent, NewMedia, NewTag, NewUser } from "shared";

export const userFactory = {
	build(overrides?: Partial<NewUser>): NewUser {
		return {
			email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
			passwordHash: "hashedpassword",
			name: "Test User",
			role: "writer",
			isActive: true,
			preferences: "{}",
			...overrides,
		} as NewUser;
	},

	buildAdmin(overrides?: Partial<NewUser>): NewUser {
		return this.build({ role: "admin", ...overrides });
	},

	buildEditor(overrides?: Partial<NewUser>): NewUser {
		return this.build({ role: "editor", ...overrides });
	},

	buildMany(count: number, overrides?: Partial<NewUser>): NewUser[] {
		return Array.from({ length: count }, () => this.build(overrides));
	},
};

export const contentFactory = {
	build(overrides?: Partial<NewContent>): NewContent {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(7);
		return {
			id: crypto.randomUUID(),
			slug: `test-content-${timestamp}-${random}`,
			title: "Test Content",
			blocks: "[]",
			contentType: "article",
			status: "draft",
			excerpt: null,
			metaTitle: null,
			metaDescription: null,
			ogImage: null,
			authorId: "PLACEHOLDER_USER_ID",
			publishedAt: null,
			scheduledFor: null,
			viewCount: 0,
			readingTimeMinutes: null,
			wordCount: null,
			deletedAt: null,
			...overrides,
		} as NewContent;
	},

	buildPublished(
		authorId: string,
		overrides?: Partial<NewContent>,
	): NewContent {
		return this.build({
			authorId,
			status: "published",
			publishedAt: new Date(),
			...overrides,
		});
	},

	buildScheduled(
		authorId: string,
		scheduledFor: Date,
		overrides?: Partial<NewContent>,
	): NewContent {
		return this.build({
			authorId,
			status: "scheduled",
			scheduledFor,
			...overrides,
		});
	},

	buildMany(count: number, overrides?: Partial<NewContent>): NewContent[] {
		return Array.from({ length: count }, () => this.build(overrides));
	},
};

export const tagFactory = {
	build(overrides?: Partial<NewTag>): NewTag {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(7);
		return {
			id: crypto.randomUUID(),
			name: `Test Tag ${timestamp}`,
			slug: `test-tag-${timestamp}-${random}`,
			description: null,
			color: "#3B82F6",
			usageCount: 0,
			...overrides,
		};
	},

	buildMany(count: number, overrides?: Partial<NewTag>): NewTag[] {
		return Array.from({ length: count }, () => this.build(overrides));
	},
};

export const mediaFactory = {
	build(uploadedBy: string, overrides?: Partial<NewMedia>): NewMedia {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(7);
		return {
			id: crypto.randomUUID(),
			filename: `test-image-${timestamp}-${random}.jpg`,
			originalFilename: "test-image.jpg",
			mimeType: "image/jpeg",
			storageProvider: "local",
			storageKey: `/uploads/test-${timestamp}-${random}.jpg`,
			storageUrl: `http://localhost:3000/uploads/test-${timestamp}-${random}.jpg`,
			sizeBytes: 102400,
			width: 1920,
			height: 1080,
			durationSeconds: null,
			blurhash: null,
			dominantColor: null,
			altText: null,
			caption: null,
			uploadedBy,
			deletedAt: null,
			...overrides,
		};
	},

	buildMany(
		uploadedBy: string,
		count: number,
		overrides?: Partial<NewMedia>,
	): NewMedia[] {
		return Array.from({ length: count }, () =>
			this.build(uploadedBy, overrides),
		);
	},
};
