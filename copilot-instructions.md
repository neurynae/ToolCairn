# ToolPilot — Copilot Instructions

## Tech Stack
TypeScript 5.7+ strict, Node.js 22 LTS, pnpm 9+, Turborepo, MCP SDK, Memgraph, Qdrant, PostgreSQL 16, Redis Streams, Next.js 15, Tailwind CSS 4, Vitest, Playwright, Biome, Zod

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

## Important: Do NOT
- Never commit .env files or hardcoded secrets
- Never use `any` type
- Never use default exports
- Never write raw SQL — use Prisma or Cypher query builders
- Never skip input validation on external boundaries

---

## Context-Specific Rules

### When working on `apps/mcp-server/**`
- All tool handlers must validate input with Zod schemas
- Return structured JSON matching product doc schema
- Every handler must handle session state via query_id
- Log all tool invocations with pino
- Never block on async operations — queue them via Redis Streams

### When working on `packages/search/**`
- Stage 1: Always combine BM25 + vector via RRF fusion
- Stage 2: Apply Qdrant payload filters, never filter in application code
- Stage 3: Compute temporal decay at query time, never as batch jobs
- Stage 4: Two-option logic only when gap < 20% AND stable/emerging split exists
- Clarification questions: max 3 per stage, must have measurable information gain
- Total search latency budget: < 200ms excluding clarification wait

### When working on `packages/graph/**`
- All Cypher queries parameterized (never string-interpolate values)
- Use neo4j-driver session management (auto-close sessions)
- Effective weight formula: base_weight × exp(-decay_rate × days_since_verified)
- All repository methods return typed results, never raw records

### When working on `apps/web/**/*.tsx`
- Server Components by default, 'use client' only when needed
- Tailwind CSS for styling, no CSS modules
- Radix UI for interactive primitives
- All props validated with TypeScript (no PropTypes)
- Colocate component tests as ComponentName.test.tsx

---

## Build Commands
- `pnpm install` — install all dependencies
- `pnpm build` — build all packages (Turborepo)
- `pnpm dev` — start all dev servers
- `pnpm test` — run all tests
- `pnpm lint` — check via Biome
- `pnpm lint:fix` — auto-fix
- `pnpm db:up` — start Docker infrastructure
- `pnpm db:seed` — seed graph with initial tool data
