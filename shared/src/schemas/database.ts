import type {
	Generated,
	Insertable,
	JSONColumnType,
	Selectable,
	Updateable,
} from "kysely";
import type {
	UserRole,
	ContentStatus,
	ContentType,
	StorageProvider,
} from "./enums";

export interface UserTable {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	image: string | null;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
	role: UserRole;
	bio: string | null;
	isActive: boolean;
	preferences: JSONColumnType<Record<string, unknown>>;
}

export interface SessionTable {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
}

export interface AccountTable {
	id: string;
	userId: string;
	accountId: string;
	providerId: string;
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: Date | null;
	refreshTokenExpiresAt: Date | null;
	password: string | null;
	scope: string | null;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
}

export interface VerificationTable {
	id: string;
	identifier: string;
	value: string;
	expiresAt: Date;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
}

export interface ContentTable {
	id: string;
	slug: string;
	title: string;
	blocks: JSONColumnType<unknown[]>;
	contentType: ContentType;
	status: ContentStatus;
	excerpt: string | null;
	metaTitle: string | null;
	metaDescription: string | null;
	ogImage: string | null;
	authorId: string;
	publishedAt: Date | null;
	scheduledFor: Date | null;
	viewCount: Generated<number>;
	readingTimeMinutes: number | null;
	wordCount: number | null;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
	deletedAt: Date | null;
}

export interface TagTable {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	color: string | null;
	usageCount: Generated<number>;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
}

export interface MediaTable {
	id: string;
	filename: string;
	originalFilename: string;
	mimeType: string;
	storageProvider: StorageProvider;
	storageKey: string;
	storageUrl: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	durationSeconds: number | null;
	blurhash: string | null;
	dominantColor: string | null;
	altText: string | null;
	caption: string | null;
	uploadedBy: string;
	createdAt: Generated<Date>;
	updatedAt: Generated<Date>;
	deletedAt: Date | null;
}

export interface Database {
	user: UserTable;
	session: SessionTable;
	account: AccountTable;
	verification: VerificationTable;
	content: ContentTable;
	tag: TagTable;
	media: MediaTable;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export type Verification = Selectable<VerificationTable>;
export type NewVerification = Insertable<VerificationTable>;
export type VerificationUpdate = Updateable<VerificationTable>;

export type Content = Selectable<ContentTable>;
export type NewContent = Insertable<ContentTable>;
export type ContentUpdate = Updateable<ContentTable>;

export type Tag = Selectable<TagTable>;
export type NewTag = Insertable<TagTable>;
export type TagUpdate = Updateable<TagTable>;

export type Media = Selectable<MediaTable>;
export type NewMedia = Insertable<MediaTable>;
export type MediaUpdate = Updateable<MediaTable>;
