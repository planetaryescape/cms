# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript monorepo starter built with Bun, Hono, Vite, and React. The project uses Turbo for build orchestration and follows a workspace-based structure with three main packages: client, server, and shared.

The project is configured for **single origin deployment** where both the API and React frontend are served from the same origin (port 3000) in production, eliminating CORS complexity.

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
- **Database**: PostgreSQL with Kysely query builder
- **Authentication**: Better Auth with email/password
- **Export Pattern**: Exports both `app` and `default` from index.ts
- **Single Origin Setup**:
  - API routes are prefixed with `/api` (e.g., `/api/hello`)
  - Better Auth routes are at `/api/auth/*`
  - Uses `serveStatic` from `hono/bun` to serve React build files from `./static`
  - Catchall route serves `index.html` for client-side routing
  - Runs on port 3000 in production serving both API and frontend

### Database Setup

- **Query Builder**: Kysely (type-safe SQL query builder)
- **Driver**: node-postgres (pg)
- **Connection**: Configured via `DATABASE_URL` environment variable
- **Location**: Database module at `server/src/db/index.ts`
- **Health Check**: `/api/db-health` endpoint for testing connection

### Authentication Setup (Better Auth)

- **Library**: Better Auth v1.4.7
- **Configuration**: `server/src/lib/auth.ts`
- **Authentication Methods**: Email/password (enabled by default)
- **Database**: Uses the same PostgreSQL database via Pool connection
- **API Routes**: All auth endpoints are available at `/api/auth/*`
- **Client Library**: `client/src/lib/auth-client.ts` (React hooks and methods)
- **Environment Variables**:
  - `BETTER_AUTH_SECRET`: Secret key for encryption (min 32 chars)
  - `BETTER_AUTH_URL`: Base URL of the application
- **Trusted Origins**: Configured to accept requests from localhost ports 5173-5175 and 3000 for development

**Schema Management:**
- Use `bunx @better-auth/cli migrate --config server/src/lib/auth.ts` to create/update auth tables
- Use `bunx @better-auth/cli generate --config server/src/lib/auth.ts` to create migration SQL files
- Auth tables: `user`, `session`, `account`, `verification`

### Development vs Production

**Development Mode:**
- Client runs on Vite dev server (port 5173)
- Server runs on Bun (port 3000)
- Vite proxy redirects `/api/*` requests to `http://localhost:3000`
- Hot reload works for both frontend and backend

**Production Mode (Single Origin):**
- Everything runs on port 3000
- Hono serves both API routes (`/api/*`) and static React files
- No CORS issues, no separate origins
- Built client files are copied to `server/static/` directory

## Development Commands

```bash
# Install dependencies (runs postinstall to build shared & server)
bun install

# Start PostgreSQL database (required for development)
docker-compose up postgres -d

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

# Single origin production build
bun run build:single  # Builds all workspaces and copies client to server/static
bun run copy:static   # Copy client/dist to server/static
bun run start:single  # Start the single origin production server

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
5. **IMPORTANT**: All API routes MUST be prefixed with `/api` (e.g., `.get("/api/users")`)
6. Use in route handlers with proper TypeScript typing

### Client Development

When adding new routes:
1. Create route files in `client/src/routes/`
2. TanStack Router plugin auto-generates routeTree.gen.ts
3. Import shared types: `import type { YourType } from 'shared'`
4. Use TanStack Query for data fetching

When making API calls:
- Use Hono RPC client: `hcWithType("/api")` (already configured in routes/index.tsx)
- The `/api` base path works in both development (via Vite proxy) and production (single origin)
- All API endpoints are accessed via the RPC client methods (e.g., `client.hello.$get()`)

When using Better Auth:
- Import from `@/lib/auth-client`: `import { signIn, signUp, signOut, useSession } from "@/lib/auth-client"`
- Use `useSession()` hook to get current user session
- Call `signIn.email()`, `signUp.email()`, `signOut()` for authentication actions
- All auth requests automatically go to `/api/auth/*` endpoints

### Shared Package Updates

After modifying shared/src/types:
1. Rebuild shared: `bun run build --filter=shared`
2. Or rely on `bun run dev` which runs tsc --watch

### Database Development

Working with Kysely:
1. Import db from `./db`: `import { db } from "./db"`
2. Use Kysely's type-safe query builder for all database operations
3. Define table interfaces in `server/src/db/index.ts` Database interface
4. Example query: `await db.selectFrom('users').selectAll().execute()`
5. Test connection: Visit `/api/db-health` endpoint

Database migrations:
- Consider using `kysely-ctl` or write custom migration scripts
- Store migrations in `server/src/db/migrations/` (to be created as needed)

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:2345/bhvr`)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth encryption (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Base URL of the application (e.g., `http://localhost:3000`)
- Client env vars must be prefixed with `VITE_` to be accessible via `import.meta.env`
- Server env vars are accessed normally via `process.env`
- Both are tracked in turbo.json for cache invalidation

## CI/CD

### GitHub Actions

The project uses GitHub Actions for continuous integration with the following quality gates:

**Workflow**: `.github/workflows/ci.yml`

**Quality Checks:**
- Linting (Biome)
- Type checking (TypeScript)
- Build verification
- Test execution

**Environment:**
- Runs on: Ubuntu latest
- Runtime: Bun (latest)
- Database: PostgreSQL 18 (service container)
- Triggers: Push to main, Pull requests to main

**Database Setup:**
- PostgreSQL service container runs during CI
- Test database: `bhvr_test`
- Automatically health-checked before running tests

## Deployment

### Single Origin Deployment (Recommended)

This project is configured for single origin deployment using Docker:

```bash
# Build and run with Docker Compose (includes PostgreSQL)
docker-compose up -d

# Or build and run manually (requires separate PostgreSQL instance)
docker build -t bhvr-app .
docker run -p 3000:3000 -e DATABASE_URL=your_db_url bhvr-app
```

The Docker Compose setup includes:
- **PostgreSQL**: PostgreSQL 18 on port 5432 with persistent volume
- **App**: Bun server with automatic dependency on healthy PostgreSQL

The Dockerfile:
- Uses `oven/bun:latest` as base image
- Installs all dependencies
- Runs `bun run build:single` to build and prepare static files
- Exposes port 3000
- Starts the server with `bun run start:single`

Test the database connection: `curl http://localhost:3000/api/db-health`

### Alternative Deployment Options

- **VPS/Bare Metal**: Run `bun run build:single && bun run start:single`
- **Cloudflare Workers**: Deploy Hono app separately (requires separate client deployment)
- **Static Client + Serverless API**: Build client and server separately, deploy to different hosts

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to `production` for production builds
- Client env vars must be prefixed with `VITE_` and set at build time

<!-- effect-solutions:start -->
## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Topics include: services and layers, data modeling, error handling, configuration, testing, HTTP clients, CLIs, observability, and project structure.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
Search here for real implementations when docs aren't enough.
<!-- effect-solutions:end -->
