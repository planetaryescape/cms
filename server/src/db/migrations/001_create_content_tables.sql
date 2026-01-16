-- Create content table
CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    content_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    excerpt TEXT,
    meta_title TEXT,
    meta_description TEXT,
    og_image TEXT,
    author_id TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    reading_time_minutes INTEGER,
    word_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create indexes for content table
CREATE INDEX IF NOT EXISTS idx_content_author_id ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);

-- Create tag table
CREATE TABLE IF NOT EXISTS tag (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for tag table
CREATE INDEX IF NOT EXISTS idx_tag_slug ON tag(slug);
CREATE INDEX IF NOT EXISTS idx_tag_usage_count ON tag(usage_count DESC);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_provider TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    blurhash TEXT,
    dominant_color TEXT,
    alt_text TEXT,
    caption TEXT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (uploaded_by) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create indexes for media table
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
