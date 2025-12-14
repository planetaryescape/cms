# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript monorepo starter built with Bun, Hono, Vite, and React. The project uses Turbo for build orchestration and follows a workspace-based structure with three main packages: client, server, and shared.

## Architecture

### Monorepo Structure

- **client/**: React frontend with TanStack Router, TanStack Query, Tailwind CSS, and shadcn/ui components
- **server/**: Hono backend API running on Bun
- **shared/**: Shared TypeScript types exported to both client and server

### Type Sharing System

The shared package must be built before client/server can use it. Types are imported via:
```typescript
import { ApiResponse } from 'shared/dist'
```

The postinstall script automatically builds shared and server packages after dependency installation.

### Path Aliases

Root tsconfig.json defines path aliases:
- `@server/*` → `./server/src/*`
- `@client/*` → `./client/src/*`
- `@shared/*` → `./shared/src/*`

Client also uses `@/` → `./client/src/` for local imports (configured in vite.config.ts).

### Client Architecture

- **Routing**: TanStack Router with file-based routing (routes auto-generated in routeTree.gen.ts)
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **UI Components**: shadcn/ui components using Radix UI primitives and class-variance-authority

### Server Architecture

- **Framework**: Hono with CORS middleware
- **Runtime**: Bun (not Node.js)
- **Export Pattern**: Exports both `app` and `default` from index.ts

## Development Commands

```bash
# Install dependencies (runs postinstall to build shared & server)
bun install

# Run all workspaces in dev mode
bun run dev

# Run individual workspaces
bun run dev:client    # Vite dev server on port 5173
bun run dev:server    # Bun server with --watch + tsc --watch

# Build all workspaces
bun run build

# Build individual workspaces
bun run build:client
bun run build:server

# Type checking
bun run type-check    # All workspaces

# Linting and formatting
bun run lint          # Biome linting
bun run format        # Biome formatting with --write

# Testing
bun run test          # All workspaces
```

## Code Style and Tooling

### Biome Configuration

- **Formatter**: Tabs for indentation, double quotes for JavaScript/TypeScript
- **Linter**: Recommended rules enabled
- **Assist**: Auto-organize imports enabled
- Uses `.gitignore` for file filtering

### TypeScript Configuration

- **Target/Module**: ESNext with bundler module resolution
- **Strict Mode**: Enabled with noUncheckedIndexedAccess
- **JSX**: react-jsx transform
- **Decorators**: Experimental decorators enabled

## Key Patterns

### Server Development

When adding new Hono routes:
1. Define types in `shared/src/types/index.ts`
2. Export them in `shared/src/index.ts`
3. Build shared package (or let dev mode rebuild)
4. Import types in server: `import type { YourType } from 'shared/dist'`
5. Use in route handlers with proper TypeScript typing

### Client Development

When adding new routes:
1. Create route files in `client/src/routes/`
2. TanStack Router plugin auto-generates routeTree.gen.ts
3. Import shared types: `import type { YourType } from 'shared'`
4. Use TanStack Query for data fetching

### Shared Package Updates

After modifying shared/src/types:
1. Rebuild shared: `bun run build --filter=shared`
2. Or rely on `bun run dev` which runs tsc --watch

## Environment Variables

- Client env vars must be prefixed with `VITE_` to be accessible via `import.meta.env`
- Server env vars are accessed normally via `process.env`
- Both are tracked in turbo.json for cache invalidation

## Deployment Notes

- **Client**: Static build outputs to `client/dist/` - deploy to any static host
- **Server**: Hono app can deploy to Cloudflare Workers, Bun, or Node.js adapters
- **Type Safety**: Shared types ensure client/server contract remains in sync
