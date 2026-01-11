// src/schemas/index.ts
import { Schema as S } from "@effect/schema";
import type { ParseError } from "@effect/schema/ParseResult";
import { type Effect, pipe } from "effect";

// =====================================================
// BRANDED TYPES (Type-safe IDs)
// =====================================================

export const UserId = pipe(S.UUID, S.brand("UserId"));
export type UserId = S.Schema.Type<typeof UserId>;

export const ContentId = pipe(S.UUID, S.brand("ContentId"));
export type ContentId = S.Schema.Type<typeof ContentId>;

export const TagId = pipe(S.UUID, S.brand("TagId"));
export type TagId = S.Schema.Type<typeof TagId>;

export const MediaId = pipe(S.UUID, S.brand("MediaId"));
export type MediaId = S.Schema.Type<typeof MediaId>;

export const SessionId = pipe(S.UUID, S.brand("SessionId"));
export type SessionId = S.Schema.Type<typeof SessionId>;

export const EmbedProviderId = pipe(S.UUID, S.brand("EmbedProviderId"));
export type EmbedProviderId = S.Schema.Type<typeof EmbedProviderId>;

export const RevisionId = pipe(S.UUID, S.brand("RevisionId"));
export type RevisionId = S.Schema.Type<typeof RevisionId>;

export const ApiKeyId = pipe(S.UUID, S.brand("ApiKeyId"));
export type ApiKeyId = S.Schema.Type<typeof ApiKeyId>;

export const WebhookId = pipe(S.UUID, S.brand("WebhookId"));
export type WebhookId = S.Schema.Type<typeof WebhookId>;

// =====================================================
// ENUMS
// =====================================================

export const UserRole = S.Literal("admin", "editor", "writer", "viewer");
export type UserRole = S.Schema.Type<typeof UserRole>;

export const ContentStatus = S.Literal(
	"draft",
	"published",
	"archived",
	"scheduled",
);
export type ContentStatus = S.Schema.Type<typeof ContentStatus>;

export const ContentType = S.Literal(
	"article",
	"update",
	"review",
	"doc",
	"newsletter",
);
export type ContentType = S.Schema.Type<typeof ContentType>;

export const StorageProvider = S.Literal("s3", "cloudflare", "local");
export type StorageProvider = S.Schema.Type<typeof StorageProvider>;

// =====================================================
// BLOCK TYPES (Content Blocks)
// =====================================================

// Base inline content
const TextContent = S.Struct({
	type: S.Literal("text"),
	text: S.String,
	marks: S.optional(
		S.Array(
			S.Union(
				S.Struct({ type: S.Literal("bold") }),
				S.Struct({ type: S.Literal("italic") }),
				S.Struct({ type: S.Literal("code") }),
				S.Struct({ type: S.Literal("strike") }),
				S.Struct({
					type: S.Literal("link"),
					attrs: S.Struct({
						href: S.String,
						target: S.optional(S.String),
					}),
				}),
			),
		),
	),
});

const InlineContent = S.Array(TextContent);

// Block types
const ParagraphBlock = S.Struct({
	type: S.Literal("paragraph"),
	content: S.optional(InlineContent),
});

const HeadingBlock = S.Struct({
	type: S.Literal("heading"),
	attrs: S.Struct({
		level: pipe(S.Number, S.int(), S.between(1, 6)),
	}),
	content: S.optional(InlineContent),
});

const ImageBlock = S.Struct({
	type: S.Literal("image"),
	attrs: S.Struct({
		src: S.String,
		alt: S.optional(S.String),
		title: S.optional(S.String),
		width: S.optional(S.Number),
		height: S.optional(S.Number),
		caption: S.optional(S.String),
	}),
});

const CodeBlock = S.Struct({
	type: S.Literal("code"),
	attrs: S.Struct({
		language: S.optional(S.String),
		filename: S.optional(S.String),
	}),
	content: S.String,
});

const BlockquoteBlock = S.Struct({
	type: S.Literal("blockquote"),
	content: S.optional(S.Array(S.Any)), // Recursive - contains other blocks
});

const ListItemBlock = S.Struct({
	type: S.Literal("listItem"),
	content: S.optional(S.Array(S.Any)),
});

const BulletListBlock = S.Struct({
	type: S.Literal("bulletList"),
	content: S.Array(ListItemBlock),
});

const OrderedListBlock = S.Struct({
	type: S.Literal("orderedList"),
	attrs: S.optional(
		S.Struct({
			start: S.optional(S.Number),
		}),
	),
	content: S.Array(ListItemBlock),
});

const HorizontalRuleBlock = S.Struct({
	type: S.Literal("horizontalRule"),
});

const EmbedBlock = S.Struct({
	type: S.Literal("embed"),
	attrs: S.Struct({
		provider: S.String,
		url: S.String,
		embedData: S.Struct({
			id: S.String,
			title: S.optional(S.String),
			description: S.optional(S.String),
			thumbnail: S.optional(S.String),
			author: S.optional(S.String),
			duration: S.optional(S.Number),
			metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
		}),
	}),
});

const CalloutBlock = S.Struct({
	type: S.Literal("callout"),
	attrs: S.Struct({
		variant: S.Literal("info", "warning", "success", "error"),
		icon: S.optional(S.String),
	}),
	content: S.optional(S.Array(S.Any)),
});

const AudioPlayerBlock = S.Struct({
	type: S.Literal("audioPlayer"),
	attrs: S.Struct({
		trackId: S.String,
		title: S.String,
		artist: S.String,
		audioUrl: S.String,
		waveformData: S.optional(S.Array(S.Number)),
		duration: S.Number,
		coverArt: S.optional(S.String),
	}),
});

const TableBlock = S.Struct({
	type: S.Literal("table"),
	content: S.Array(
		S.Struct({
			type: S.Literal("tableRow"),
			content: S.Array(
				S.Union(
					S.Struct({
						type: S.Literal("tableHeader"),
						content: S.optional(InlineContent),
					}),
					S.Struct({
						type: S.Literal("tableCell"),
						content: S.optional(InlineContent),
					}),
				),
			),
		}),
	),
});

// Union of all block types
export const ContentBlock = S.Union(
	ParagraphBlock,
	HeadingBlock,
	ImageBlock,
	CodeBlock,
	BlockquoteBlock,
	BulletListBlock,
	OrderedListBlock,
	HorizontalRuleBlock,
	EmbedBlock,
	CalloutBlock,
	AudioPlayerBlock,
	TableBlock,
);
export type ContentBlock = S.Schema.Type<typeof ContentBlock>;

export const ContentBlocks = S.Array(ContentBlock);
export type ContentBlocks = S.Schema.Type<typeof ContentBlocks>;

// =====================================================
// USER SCHEMA
// =====================================================

export const User = S.Struct({
	id: UserId,
	email: pipe(
		S.String,
		S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
		S.annotations({ message: () => "Invalid email format" }),
	),
	passwordHash: S.String,
	name: pipe(S.String, S.minLength(1), S.maxLength(255)),
	avatarUrl: S.optional(S.String),
	bio: S.optional(S.String),
	role: UserRole,
	isActive: S.Boolean,
	preferences: S.Record({ key: S.String, value: S.Unknown }),
	emailVerifiedAt: S.NullOr(S.Date),
	lastLoginAt: S.NullOr(S.Date),
	createdAt: S.Date,
	updatedAt: S.Date,
});
export type User = S.Schema.Type<typeof User>;

// Derived types
export const UserInsert = S.Struct({
	email: User.fields.email,
	passwordHash: User.fields.passwordHash,
	name: User.fields.name,
	avatarUrl: User.fields.avatarUrl,
	bio: User.fields.bio,
	role: User.fields.role,
	isActive: User.fields.isActive,
	preferences: User.fields.preferences,
});
export type UserInsert = S.Schema.Type<typeof UserInsert>;

export const UserUpdate = S.partial(UserInsert);
export type UserUpdate = S.Schema.Type<typeof UserUpdate>;

export const UserPublic = S.Struct({
	id: User.fields.id,
	name: User.fields.name,
	avatarUrl: User.fields.avatarUrl,
	bio: User.fields.bio,
	role: User.fields.role,
	createdAt: User.fields.createdAt,
});
export type UserPublic = S.Schema.Type<typeof UserPublic>;

// =====================================================
// SESSION SCHEMA
// =====================================================

export const Session = S.Struct({
	id: SessionId,
	userId: UserId,
	token: pipe(S.String, S.minLength(32)),
	refreshToken: S.optional(S.String),
	ipAddress: S.optional(S.String),
	userAgent: S.optional(S.String),
	expiresAt: S.Date,
	createdAt: S.Date,
});
export type Session = S.Schema.Type<typeof Session>;

export const SessionInsert = S.Struct({
	userId: Session.fields.userId,
	token: Session.fields.token,
	refreshToken: Session.fields.refreshToken,
	ipAddress: Session.fields.ipAddress,
	userAgent: Session.fields.userAgent,
	expiresAt: Session.fields.expiresAt,
});
export type SessionInsert = S.Schema.Type<typeof SessionInsert>;

// =====================================================
// CONTENT SCHEMA
// =====================================================

export const Content = S.Struct({
	id: ContentId,
	slug: pipe(
		S.String,
		S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		S.maxLength(255),
		S.annotations({ message: () => "Invalid slug format" }),
	),
	title: pipe(S.String, S.minLength(1), S.maxLength(500)),
	blocks: ContentBlocks,
	contentType: ContentType,
	status: ContentStatus,
	excerpt: S.NullOr(S.String),
	metaTitle: S.NullOr(pipe(S.String, S.maxLength(255))),
	metaDescription: S.NullOr(pipe(S.String, S.maxLength(500))),
	ogImage: S.NullOr(S.String),
	authorId: UserId,
	publishedAt: S.NullOr(S.Date),
	scheduledFor: S.NullOr(S.Date),
	viewCount: pipe(S.Number, S.int(), S.greaterThanOrEqualTo(0)),
	readingTimeMinutes: S.NullOr(
		pipe(S.Number, S.int(), S.greaterThanOrEqualTo(0)),
	),
	wordCount: S.NullOr(pipe(S.Number, S.int(), S.greaterThanOrEqualTo(0))),
	createdAt: S.Date,
	updatedAt: S.Date,
	deletedAt: S.NullOr(S.Date),
});
export type Content = S.Schema.Type<typeof Content>;

export const ContentInsert = S.Struct({
	slug: Content.fields.slug,
	title: Content.fields.title,
	blocks: Content.fields.blocks,
	contentType: Content.fields.contentType,
	status: S.optional(Content.fields.status),
	excerpt: S.optional(Content.fields.excerpt),
	metaTitle: S.optional(Content.fields.metaTitle),
	metaDescription: S.optional(Content.fields.metaDescription),
	ogImage: S.optional(Content.fields.ogImage),
	authorId: Content.fields.authorId,
	scheduledFor: S.optional(Content.fields.scheduledFor),
});
export type ContentInsert = S.Schema.Type<typeof ContentInsert>;

export const ContentUpdate = S.partial(
	S.Struct({
		slug: Content.fields.slug,
		title: Content.fields.title,
		blocks: Content.fields.blocks,
		contentType: Content.fields.contentType,
		status: Content.fields.status,
		excerpt: Content.fields.excerpt,
		metaTitle: Content.fields.metaTitle,
		metaDescription: Content.fields.metaDescription,
		ogImage: Content.fields.ogImage,
		publishedAt: Content.fields.publishedAt,
		scheduledFor: Content.fields.scheduledFor,
	}),
);
export type ContentUpdate = S.Schema.Type<typeof ContentUpdate>;

export const ContentWithAuthor = S.Struct({
	...Content.fields,
	author: UserPublic,
});
export type ContentWithAuthor = S.Schema.Type<typeof ContentWithAuthor>;

export const ContentWithTags = S.Struct({
	...Content.fields,
	tags: S.Array(S.Any), // Will define Tag schema below
});
export type ContentWithTags = S.Schema.Type<typeof ContentWithTags>;

// =====================================================
// TAG SCHEMA
// =====================================================

export const Tag = S.Struct({
	id: TagId,
	name: pipe(S.String, S.minLength(1), S.maxLength(100)),
	slug: pipe(
		S.String,
		S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		S.maxLength(100),
	),
	description: S.NullOr(S.String),
	color: S.NullOr(
		pipe(
			S.String,
			S.pattern(/^#[0-9A-Fa-f]{6}$/),
			S.annotations({ message: () => "Invalid hex color" }),
		),
	),
	usageCount: pipe(S.Number, S.int(), S.greaterThanOrEqualTo(0)),
	createdAt: S.Date,
	updatedAt: S.Date,
});
export type Tag = S.Schema.Type<typeof Tag>;

export const TagInsert = S.Struct({
	name: Tag.fields.name,
	slug: Tag.fields.slug,
	description: S.optional(Tag.fields.description),
	color: S.optional(Tag.fields.color),
});
export type TagInsert = S.Schema.Type<typeof TagInsert>;

export const TagUpdate = S.partial(TagInsert);
export type TagUpdate = S.Schema.Type<typeof TagUpdate>;

// =====================================================
// MEDIA SCHEMA
// =====================================================

export const Media = S.Struct({
	id: MediaId,
	filename: pipe(S.String, S.maxLength(255)),
	originalFilename: pipe(S.String, S.maxLength(255)),
	mimeType: pipe(S.String, S.maxLength(100)),
	storageProvider: StorageProvider,
	storageKey: pipe(S.String, S.maxLength(500)),
	storageUrl: S.String,
	sizeBytes: pipe(S.Number, S.int(), S.greaterThan(0)),
	width: S.NullOr(pipe(S.Number, S.int(), S.greaterThan(0))),
	height: S.NullOr(pipe(S.Number, S.int(), S.greaterThan(0))),
	durationSeconds: S.NullOr(pipe(S.Number, S.greaterThan(0))),
	blurhash: S.NullOr(S.String),
	dominantColor: S.NullOr(pipe(S.String, S.pattern(/^#[0-9A-Fa-f]{6}$/))),
	altText: S.NullOr(S.String),
	caption: S.NullOr(S.String),
	uploadedBy: UserId,
	createdAt: S.Date,
	updatedAt: S.Date,
	deletedAt: S.NullOr(S.Date),
});
export type Media = S.Schema.Type<typeof Media>;

export const MediaInsert = S.Struct({
	filename: Media.fields.filename,
	originalFilename: Media.fields.originalFilename,
	mimeType: Media.fields.mimeType,
	storageProvider: S.optional(Media.fields.storageProvider),
	storageKey: Media.fields.storageKey,
	storageUrl: Media.fields.storageUrl,
	sizeBytes: Media.fields.sizeBytes,
	width: S.optional(Media.fields.width),
	height: S.optional(Media.fields.height),
	durationSeconds: S.optional(Media.fields.durationSeconds),
	blurhash: S.optional(Media.fields.blurhash),
	dominantColor: S.optional(Media.fields.dominantColor),
	altText: S.optional(Media.fields.altText),
	caption: S.optional(Media.fields.caption),
	uploadedBy: Media.fields.uploadedBy,
});
export type MediaInsert = S.Schema.Type<typeof MediaInsert>;

export const MediaUpdate = S.partial(
	S.Struct({
		altText: Media.fields.altText,
		caption: Media.fields.caption,
	}),
);
export type MediaUpdate = S.Schema.Type<typeof MediaUpdate>;

// =====================================================
// EMBED PROVIDER SCHEMA
// =====================================================

export const EmbedProvider = S.Struct({
	id: EmbedProviderId,
	name: pipe(S.String, S.maxLength(100)),
	displayName: pipe(S.String, S.maxLength(100)),
	iconUrl: S.NullOr(S.String),
	urlPatterns: S.Array(S.String),
	embedTemplate: S.NullOr(S.String),
	config: S.Record({ key: S.String, value: S.Unknown }),
	isActive: S.Boolean,
	isBuiltin: S.Boolean,
	createdBy: S.NullOr(UserId),
	createdAt: S.Date,
	updatedAt: S.Date,
});
export type EmbedProvider = S.Schema.Type<typeof EmbedProvider>;

export const EmbedProviderInsert = S.Struct({
	name: EmbedProvider.fields.name,
	displayName: EmbedProvider.fields.displayName,
	iconUrl: S.optional(EmbedProvider.fields.iconUrl),
	urlPatterns: EmbedProvider.fields.urlPatterns,
	embedTemplate: S.optional(EmbedProvider.fields.embedTemplate),
	config: S.optional(EmbedProvider.fields.config),
	isActive: S.optional(EmbedProvider.fields.isActive),
	isBuiltin: S.optional(EmbedProvider.fields.isBuiltin),
	createdBy: S.optional(EmbedProvider.fields.createdBy),
});
export type EmbedProviderInsert = S.Schema.Type<typeof EmbedProviderInsert>;

export const EmbedProviderUpdate = S.partial(EmbedProviderInsert);
export type EmbedProviderUpdate = S.Schema.Type<typeof EmbedProviderUpdate>;

// =====================================================
// CONTENT REVISION SCHEMA
// =====================================================

export const ContentRevision = S.Struct({
	id: RevisionId,
	contentId: ContentId,
	title: pipe(S.String, S.maxLength(500)),
	blocks: ContentBlocks,
	authorId: UserId,
	changeNote: S.NullOr(S.String),
	createdAt: S.Date,
});
export type ContentRevision = S.Schema.Type<typeof ContentRevision>;

export const ContentRevisionInsert = S.Struct({
	contentId: ContentRevision.fields.contentId,
	title: ContentRevision.fields.title,
	blocks: ContentRevision.fields.blocks,
	authorId: ContentRevision.fields.authorId,
	changeNote: S.optional(ContentRevision.fields.changeNote),
});
export type ContentRevisionInsert = S.Schema.Type<typeof ContentRevisionInsert>;

// =====================================================
// CONTENT VIEW SCHEMA
// =====================================================

export const ContentView = S.Struct({
	id: S.UUID,
	contentId: ContentId,
	visitorId: S.NullOr(S.String),
	ipAddress: S.NullOr(S.String),
	userAgent: S.NullOr(S.String),
	referrer: S.NullOr(S.String),
	countryCode: S.NullOr(pipe(S.String, S.length(2))),
	viewedAt: S.Date,
});
export type ContentView = S.Schema.Type<typeof ContentView>;

export const ContentViewInsert = S.Struct({
	contentId: ContentView.fields.contentId,
	visitorId: S.optional(ContentView.fields.visitorId),
	ipAddress: S.optional(ContentView.fields.ipAddress),
	userAgent: S.optional(ContentView.fields.userAgent),
	referrer: S.optional(ContentView.fields.referrer),
	countryCode: S.optional(ContentView.fields.countryCode),
});
export type ContentViewInsert = S.Schema.Type<typeof ContentViewInsert>;

// =====================================================
// API KEY SCHEMA
// =====================================================

export const ApiScope = S.Literal(
	"read:content",
	"write:content",
	"delete:content",
	"read:media",
	"write:media",
	"delete:media",
	"read:users",
	"write:users",
	"admin",
);
export type ApiScope = S.Schema.Type<typeof ApiScope>;

export const ApiKey = S.Struct({
	id: ApiKeyId,
	name: pipe(S.String, S.maxLength(255)),
	keyHash: S.String,
	keyPrefix: pipe(S.String, S.maxLength(20)),
	userId: UserId,
	scopes: S.Array(ApiScope),
	rateLimit: S.NullOr(pipe(S.Number, S.int(), S.greaterThan(0))),
	isActive: S.Boolean,
	expiresAt: S.NullOr(S.Date),
	lastUsedAt: S.NullOr(S.Date),
	createdAt: S.Date,
});
export type ApiKey = S.Schema.Type<typeof ApiKey>;

export const ApiKeyInsert = S.Struct({
	name: ApiKey.fields.name,
	keyHash: ApiKey.fields.keyHash,
	keyPrefix: ApiKey.fields.keyPrefix,
	userId: ApiKey.fields.userId,
	scopes: ApiKey.fields.scopes,
	rateLimit: S.optional(ApiKey.fields.rateLimit),
	expiresAt: S.optional(ApiKey.fields.expiresAt),
});
export type ApiKeyInsert = S.Schema.Type<typeof ApiKeyInsert>;

// =====================================================
// WEBHOOK SCHEMA
// =====================================================

export const WebhookEvent = S.Literal(
	"content.created",
	"content.updated",
	"content.published",
	"content.deleted",
	"media.uploaded",
	"media.deleted",
);
export type WebhookEvent = S.Schema.Type<typeof WebhookEvent>;

export const Webhook = S.Struct({
	id: WebhookId,
	url: S.String,
	events: S.Array(WebhookEvent),
	secret: S.String,
	userId: UserId,
	isActive: S.Boolean,
	lastTriggeredAt: S.NullOr(S.Date),
	lastSuccessAt: S.NullOr(S.Date),
	lastErrorAt: S.NullOr(S.Date),
	failureCount: pipe(S.Number, S.int(), S.greaterThanOrEqualTo(0)),
	createdAt: S.Date,
});
export type Webhook = S.Schema.Type<typeof Webhook>;

export const WebhookInsert = S.Struct({
	url: Webhook.fields.url,
	events: Webhook.fields.events,
	secret: Webhook.fields.secret,
	userId: Webhook.fields.userId,
	isActive: S.optional(Webhook.fields.isActive),
});
export type WebhookInsert = S.Schema.Type<typeof WebhookInsert>;

export const WebhookUpdate = S.partial(
	S.Struct({
		url: Webhook.fields.url,
		events: Webhook.fields.events,
		isActive: Webhook.fields.isActive,
	}),
);
export type WebhookUpdate = S.Schema.Type<typeof WebhookUpdate>;

// =====================================================
// PAGINATION & FILTERING
// =====================================================

export const PaginationParams = S.Struct({
	page: S.optional(pipe(S.Number, S.int(), S.greaterThan(0))),
	perPage: S.optional(pipe(S.Number, S.int(), S.between(1, 100))),
	sortBy: S.optional(S.String),
	sortOrder: S.optional(S.Literal("asc", "desc")),
});
export type PaginationParams = S.Schema.Type<typeof PaginationParams>;

export const PaginatedResponse = <A, I, R>(itemSchema: S.Schema<A, I, R>) =>
	S.Struct({
		data: S.Array(itemSchema),
		meta: S.Struct({
			page: S.Number,
			perPage: S.Number,
			total: S.Number,
			totalPages: S.Number,
		}),
	});

export const ContentFilters = S.Struct({
	status: S.optional(ContentStatus),
	contentType: S.optional(ContentType),
	authorId: S.optional(UserId),
	tagId: S.optional(TagId),
	search: S.optional(S.String),
	fromDate: S.optional(S.Date),
	toDate: S.optional(S.Date),
});
export type ContentFilters = S.Schema.Type<typeof ContentFilters>;

export const MediaFilters = S.Struct({
	mimeType: S.optional(S.String),
	uploadedBy: S.optional(UserId),
	search: S.optional(S.String),
});
export type MediaFilters = S.Schema.Type<typeof MediaFilters>;

// =====================================================
// API RESPONSE TYPES
// =====================================================

export const ApiError = S.Struct({
	error: S.Struct({
		code: S.String,
		message: S.String,
		details: S.optional(S.Record({ key: S.String, value: S.Unknown })),
	}),
});
export type ApiError = S.Schema.Type<typeof ApiError>;

export const ApiSuccess = <A, I, R>(dataSchema: S.Schema<A, I, R>) =>
	S.Struct({
		data: dataSchema,
		meta: S.optional(S.Record({ key: S.String, value: S.Unknown })),
	});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const decodeOrThrow =
	<A, I>(schema: S.Schema<A, I>) =>
	(input: unknown): Effect.Effect<A, ParseError> => {
		return S.decodeUnknown(schema)(input);
	};

export const encodeOrThrow =
	<A, I>(schema: S.Schema<A, I>) =>
	(value: A): Effect.Effect<I, ParseError> => {
		return S.encode(schema)(value);
	};
