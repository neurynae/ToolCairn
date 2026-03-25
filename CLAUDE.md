# ToolPilot

Agent-first, graph-powered tool intelligence platform. MCP server (primary) + web interface (secondary) over Memgraph + Qdrant.

## Tech Stack
- TypeScript 5.7+ strict, Node.js 22 LTS, pnpm 9+, Turborepo
- MCP: @modelcontextprotocol/sdk v1.27+
- Graph DB: Memgraph (Bolt via neo4j-driver)
- Vector: Qdrant (@qdrant/js-client-rest), Nomic Embed Code 768d
- Staging DB: PostgreSQL 16 (Prisma)
- Queue: Redis 7 Streams (ioredis)
- Web: Next.js 15 (App Router), Tailwind CSS 4, Radix UI
- Testing: Vitest (unit/integration), Playwright (E2E)
- Linting: Biome | Logging: pino | Validation: Zod

## Build Commands
- `pnpm install` — install all dependencies
- `pnpm build` — build all packages (Turborepo)
- `pnpm dev` — start all dev servers
- `pnpm test` — run all tests
- `pnpm test:unit` — unit tests only
- `pnpm test:e2e` — Playwright E2E
- `pnpm lint` — check via Biome
- `pnpm lint:fix` — auto-fix
- `pnpm db:up` — start Docker infrastructure
- `pnpm db:down` — stop Docker infrastructure
- `pnpm db:seed` — seed graph with initial tool data
- `pnpm indexer:run` — run GitHub indexer

## Coding Standards
- TypeScript strict mode; no `any` except generated code
- Functional style; classes only for stateful services
- Named exports only (no default exports)
- Zod for all external input validation
- Result pattern: `{ ok: true, data } | { ok: false, error }` for domain logic
- Repository interfaces for all DB access (testable with in-memory fakes)
- Structured JSON logging via pino
- Validated config module (Zod schema over process.env)
- All async functions use try/catch, never unhandled promise rejections

## File Naming
- kebab-case for all files and directories
- `.ts` for logic, `.tsx` for React components
- `.test.ts` colocated with source
- Suffixes: `.schema.ts`, `.repository.ts`, `.service.ts`, `.handler.ts`

## Commit Conventions
- Conventional Commits: `type(scope): description`
- Types: feat, fix, refactor, test, docs, chore, ci
- Scopes: graph, search, mcp, indexer, web, admin, infra, core

## Architecture
- Monorepo: pnpm workspaces + Turborepo
- apps/mcp-server — MCP server (primary product)
- apps/web — Next.js (public + admin)
- apps/indexer — GitHub indexer + workers
- packages/core — shared types, schemas
- packages/graph — Memgraph client + queries
- packages/vector — Qdrant + embeddings + search
- packages/search — 4-stage search engine
- packages/db — PostgreSQL (Prisma)
- packages/queue — Redis Streams
- packages/config — env config loader

## Important: Do NOT
- Never commit .env files or hardcoded secrets
- Never use `any` type
- Never use default exports
- Never write raw SQL — use Prisma or Cypher query builders
- Never skip input validation on external boundaries
