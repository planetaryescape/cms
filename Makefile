.PHONY: help dev dev-db stop build build-single start-single production lint type-check test format clean migrate migrate-down migrate-status

help:
	@echo "Available targets:"
	@echo ""
	@echo "Development:"
	@echo "  dev            - Start Postgres + run dev servers with HMR"
	@echo "  dev-db         - Start Postgres for local development"
	@echo "  stop           - Stop all Docker containers"
	@echo ""
	@echo "Database:"
	@echo "  migrate        - Run Better Auth + Kysely migrations"
	@echo "  migrate-down   - Rollback last Kysely migration"
	@echo "  migrate-status - Show migration status"
	@echo ""
	@echo "Build:"
	@echo "  build          - Build all workspaces"
	@echo "  build-single   - Build for single-origin deployment"
	@echo "  start-single   - Start production server"
	@echo "  production     - Run full production stack in Docker"
	@echo ""
	@echo "Quality:"
	@echo "  lint           - Run linter"
	@echo "  type-check     - Run TypeScript type checking"
	@echo "  test           - Run tests"
	@echo "  format         - Format code"
	@echo ""
	@echo "Utilities:"
	@echo "  clean          - Remove build artifacts and Docker volumes"

dev-db:
	docker compose up -d

dev: dev-db
	bun run dev

stop:
	docker compose down

build:
	bun run build

build-single:
	bun run build:single

start-single:
	bun run start:single

production:
	docker compose --profile production up -d

lint:
	bun run lint

type-check:
	bun run type-check

test:
	bun run test

format:
	bun run format

migrate:
	cd server && bun run migrate:up

migrate-down:
	cd server && bun run migrate:down

migrate-status:
	cd server && bun run migrate:status

clean:
	rm -rf client/dist server/dist shared/dist server/static
	docker compose down -v
