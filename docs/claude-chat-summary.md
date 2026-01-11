# Block Storage Architecture

## Overview

Content Kit uses a **block-based JSON storage model** where all content is represented as an array of structured blocks stored in PostgreSQL's JSONB format. This architecture enables:

- Direct editor-to-database mapping (zero conversion overhead)
- Infinite extensibility through new block types
- Powerful structured queries via JSONB operators
- Runtime type safety with Effect schemas
- Efficient indexing and full-text search

---

## Core Concepts

### Block Structure

Every block follows this pattern:

```json
{
  "type": "block-type-name",
  "attrs": {
    "attribute1": "value1",
    "attribute2": "value2"
  },
  "content": [
    // Nested inline content or child blocks
  ]
}
```

### Storage Schema

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY,
  title VARCHAR(500),
  blocks JSONB NOT NULL DEFAULT '[]',  -- Array of block objects
  search_vector tsvector,               -- Generated full-text search
  ...
);

-- Indexes
CREATE INDEX idx_content_blocks ON content USING GIN(blocks);
CREATE INDEX idx_content_search ON content USING GIN(search_vector);
```

**Key Points:**

- Use JSONB (not JSON) for native indexing and querying
- Store as array of blocks, not nested document
- Leverage PostgreSQL's JSONB operators for queries

---

## Block Type Hierarchy

### Leaf Blocks (No children)

- `image` - Images with metadata
- `horizontalRule` - Visual dividers
- `embed` - External embeds (YouTube, SoundCloud, etc.)
- `audioPlayer` - Custom audio player (Goosebumps.fm)

### Container Blocks (Have children)

- `paragraph` - Text with inline formatting
- `heading` - Headings (h1-h6)
- `blockquote` - Block quotes
- `bulletList` / `orderedList` - Lists
- `callout` - Info boxes with nested content
- `table` - Tables with rows and cells
- `code` - Code blocks with syntax highlighting

### Inline Content (Inside container blocks)

- `text` - Plain text nodes
- Text with `marks` - Bold, italic, link, code, strike

---

## Data Flow

### Creating Content

```
Editor (TipTap)
  → Frontend Validation (Effect schemas)
  → API: POST /api/content
  → Hono/Bun Server (enrich metadata, validate)
  → PostgreSQL via Kysely (store as JSONB)
```

### Retrieving Content

```
PostgreSQL via Kysely (SELECT blocks FROM content)
  → Hono/Bun Server (optional enrichment)
  → API: GET /api/content/:id
  → Frontend Renderer (React components per block type)
```

---

## Storage Examples

### Simple Article

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Content Kit",
  "blocks": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Welcome to Content Kit" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is a " },
        {
          "type": "text",
          "text": "modern CMS",
          "marks": [{ "type": "bold" }]
        },
        { "type": "text", "text": " for creators." }
      ]
    },
    {
      "type": "image",
      "attrs": {
        "src": "https://cdn.example.com/hero.jpg",
        "alt": "Hero image",
        "caption": "Beautiful landscape",
        "width": 1200,
        "height": 630
      }
    }
  ]
}
```

### Rich Content with Embeds

```json
{
  "blocks": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Check out this track:" }]
    },
    {
      "type": "embed",
      "attrs": {
        "provider": "soundcloud",
        "url": "https://soundcloud.com/artist/track",
        "embedData": {
          "id": "123456789",
          "title": "Amazing Track",
          "author": "Artist Name",
          "thumbnail": "https://i1.sndcdn.com/...",
          "duration": 180,
          "metadata": {
            "plays": 50000,
            "likes": 1200
          }
        }
      }
    },
    {
      "type": "callout",
      "attrs": {
        "variant": "info",
        "icon": "💡"
      },
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Featured on Goosebumps.fm" }]
        }
      ]
    }
  ]
}
```

### Code Block

```json
{
  "type": "code",
  "attrs": {
    "language": "typescript",
    "filename": "example.ts"
  },
  "content": "const greeting = 'Hello, World!';\nconsole.log(greeting);"
}
```

---

## Querying Blocks

### JSONB Operators

```sql
-- Find content with YouTube embeds
SELECT * FROM content
WHERE blocks @> '[{"type": "embed", "attrs": {"provider": "youtube"}}]';

-- Find content with h1 headings
SELECT * FROM content
WHERE blocks @> '[{"type": "heading", "attrs": {"level": 1}}]';

-- Count block types across all content
SELECT
  block->>'type' as block_type,
  COUNT(*) as usage_count
FROM content,
     jsonb_array_elements(blocks) as block
GROUP BY block_type
ORDER BY usage_count DESC;

-- Find content with images
SELECT * FROM content
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(blocks) as block
  WHERE block->>'type' = 'image'
);

-- Find content with Go code blocks
SELECT * FROM content
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(blocks) as block
  WHERE block->>'type' = 'code'
  AND block->'attrs'->>'language' = 'go'
);
```

### Full-Text Search

```sql
-- Search across all content
SELECT
    id,
    title,
    excerpt,
    ts_rank(search_vector, query) AS rank
FROM content,
     to_tsquery('english', 'content & management') AS query
WHERE search_vector @@ query
  AND status = 'published'
ORDER BY rank DESC
LIMIT 20;
```

### Performance Indexes

```sql
-- General JSONB index
CREATE INDEX idx_content_blocks ON content USING GIN(blocks);

-- Partial indexes for common queries
CREATE INDEX idx_content_has_embeds
  ON content ((blocks @> '[{"type": "embed"}]'));

CREATE INDEX idx_content_has_images
  ON content ((blocks @> '[{"type": "image"}]'));

-- Full-text search
CREATE INDEX idx_content_search ON content USING GIN(search_vector);
```

---

## Processing Pipeline

### On Content Save

```typescript
import { Schema as S } from "effect"
import * as Uuid from "effect/Uuid"
import { db } from "./db"
import type { ContentInput, Content, Block } from "shared"

async function processContent(input: ContentInput): Promise<Content> {
    // 1. Validate blocks against Effect schemas
    const validated = S.decodeUnknownSync(ContentBlocksSchema)(input.blocks)

    // 2. Compute metadata
    const wordCount = countWords(input.blocks)
    const readingTime = calculateReadingTime(wordCount)

    // 3. Extract and enrich embeds
    const blocks = await enrichEmbeds(input.blocks)

    // 4. Generate excerpt if not provided
    const excerpt = input.excerpt || generateExcerpt(blocks)

    // 5. Save to database via Kysely
    const content = await db
        .insertInto("content")
        .values({
            id: Uuid.v7(),
            title: input.title,
            blocks: JSON.stringify(blocks),
            word_count: wordCount,
            reading_time_minutes: readingTime,
            excerpt,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

    return content
}
```

### Helper Functions

```typescript
import type { Block, InlineContent } from "shared"

function extractText(blocks: Block[]): string {
    const textParts: string[] = []

    for (const block of blocks) {
        if (block.type === "paragraph" || block.type === "heading") {
            for (const inline of block.content ?? []) {
                if (inline.type === "text") {
                    textParts.push(inline.text)
                }
            }
        }
    }

    return textParts.join(" ")
}

function countWords(blocks: Block[]): number {
    const text = extractText(blocks)
    return text.split(/\s+/).filter(Boolean).length
}

function generateExcerpt(blocks: Block[]): string {
    for (const block of blocks) {
        if (block.type === "paragraph") {
            const text = extractText([block])
            if (text.length > 160) {
                return text.slice(0, 160) + "..."
            }
            return text
        }
    }
    return ""
}

async function enrichEmbeds(blocks: Block[]): Promise<Block[]> {
    return Promise.all(
        blocks.map(async (block) => {
            if (block.type === "embed" && block.attrs?.url) {
                const metadata = await fetchEmbedMetadata(block.attrs.url)
                return { ...block, attrs: { ...block.attrs, embedData: metadata } }
            }
            return block
        })
    )
}
```

---

## Extensibility

### Adding New Block Types

1. **Define Schema** (`src/schemas/index.ts`):

```typescript
const CustomWidgetBlock = S.Struct({
  type: S.Literal("customWidget"),
  attrs: S.Struct({
    widgetId: S.String,
    config: S.Record(S.String, S.Unknown),
  }),
});

// Add to ContentBlock union
export const ContentBlock = S.Union(
  ParagraphBlock,
  HeadingBlock,
  // ...existing blocks
  CustomWidgetBlock // Add new block
);
```

2. **Register in Editor** (`frontend/admin`):

```typescript
import { Node } from "@tiptap/core";

export const CustomWidget = Node.create({
  name: "customWidget",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      widgetId: { default: null },
      config: { default: {} },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="custom-widget"]' }];
  },

  renderHTML({ node }) {
    return ["div", { "data-type": "custom-widget" }, 0];
  },
});
```

3. **Create Renderer**:

```typescript
function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'customWidget':
      return <CustomWidgetBlock block={block} />;
    default:
      return null;
  }
}
```

4. **No Backend Changes Required** - PostgreSQL JSONB handles any valid JSON!

---

## Versioning & Revisions

### Automatic Revision Tracking

```typescript
import * as Uuid from "effect/Uuid"
import { db } from "./db"
import type { ContentUpdate } from "shared"

async function updateContent(id: string, updates: ContentUpdate): Promise<void> {
    // 1. Fetch current version
    const current = await db
        .selectFrom("content")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirstOrThrow()

    // 2. Save revision before updating
    await db
        .insertInto("content_revisions")
        .values({
            id: Uuid.v7(),
            content_id: id,
            title: current.title,
            blocks: current.blocks,
            author_id: current.authorId,
            created_at: new Date(),
        })
        .execute()

    // 3. Apply updates
    await db
        .updateTable("content")
        .set(updates)
        .where("id", "=", id)
        .execute()
}
```

### Revision Queries

```sql
-- Get all revisions for content
SELECT *
FROM content_revisions
WHERE content_id = $1
ORDER BY created_at DESC;

-- Compare two revisions
SELECT
    r1.blocks as old_blocks,
    r2.blocks as new_blocks
FROM content_revisions r1
JOIN content_revisions r2 ON r1.content_id = r2.content_id
WHERE r1.id = $1 AND r2.id = $2;
```

---

## Performance Considerations

### Caching Strategy

```typescript
import { db } from "./db"

interface CacheKey {
    contentId: string
    version: number
}

const cache = new Map<string, string>()

function getCacheKey(key: CacheKey): string {
    return `${key.contentId}:${key.version}`
}

async function getRenderedContent(id: string): Promise<string> {
    const content = await db
        .selectFrom("content")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirstOrThrow()

    const cacheKey = getCacheKey({ contentId: id, version: content.version })
    const cached = cache.get(cacheKey)
    if (cached) {
        return cached
    }

    const rendered = renderBlocks(content.blocks)
    cache.set(cacheKey, rendered)

    return rendered
}
```

### Selective Fetching

```sql
-- List view: Fetch metadata only (no blocks)
SELECT id, title, excerpt, word_count, published_at
FROM content
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 20;

-- Detail view: Fetch full content including blocks
SELECT *
FROM content
WHERE id = $1;
```

### Database Partitioning

For high-volume sites, consider partitioning `content_views` by date:

```sql
CREATE TABLE content_views_2025_01 PARTITION OF content_views
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## Migration Strategy

### Block Structure Migrations

If you need to change block structure:

```typescript
import { db } from "./db"
import type { Block } from "shared"

async function migrateBlocksV1ToV2(): Promise<void> {
    const contents = await db
        .selectFrom("content")
        .selectAll()
        .execute()

    for (const content of contents) {
        const blocks = JSON.parse(content.blocks) as Block[]
        const newBlocks = blocks.map((block) => {
            if (block.type === "oldType") {
                return {
                    type: "newType",
                    attrs: transformAttrs(block.attrs),
                }
            }
            return block
        })

        await db
            .updateTable("content")
            .set({ blocks: JSON.stringify(newBlocks) })
            .where("id", "=", content.id)
            .execute()
    }
}
```

---

## Key Benefits

| Feature                    | How Blocks Enable It                      |
| -------------------------- | ----------------------------------------- |
| **Zero Conversion**        | Editor state === Database state           |
| **Infinite Extensibility** | Add block types without DB migrations     |
| **Rich Content**           | Native support for embeds, media, layouts |
| **Powerful Queries**       | JSONB operators for complex filtering     |
| **Versioning**             | Store complete snapshots per revision     |
| **Type Safety**            | Runtime validation via Effect schemas     |
| **Performance**            | Index specific block patterns             |
| **API-First**              | Same format for storage and responses     |
| **Future-Proof**           | JSON is universal and portable            |

---

## Reference Implementation

See these files for complete implementation:

- `/server/src/` - Hono/Bun server with Kysely database access
- `/shared/src/schemas/` - Effect schema definitions
- `/client/src/components/` - React block rendering components
- `/server/src/db/` - Kysely database configuration and types

---

## Further Reading

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [TipTap Editor Documentation](https://tiptap.dev/)
- [Effect Schema Documentation](https://effect.website/docs/schema/introduction)
- [Kysely Documentation](https://kysely.dev/)
- [Hono Documentation](https://hono.dev/)
- [Bun Documentation](https://bun.sh/docs)
