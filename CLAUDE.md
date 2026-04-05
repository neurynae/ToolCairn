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

## Production Architecture

```
npm client (@neurynae/toolcairn-mcp)
        ↓
Cloudflare Worker (CF edge — rate limiting, caching, auth)
        ↓
api.neurynae.com → origin.neurynae.com (AWS EC2 Mumbai — gray-cloud DNS)
        ↓
Docker Compose on VPS: API + Memgraph + Qdrant + PostgreSQL + Redis
```

## Environments

| Env | URL | Mode |
|-----|-----|------|
| Local dev (public) | http://localhost:3005 | direct DB connections |
| Local dev (admin) | http://localhost:3001 | `TOOLPILOT_MODE=dev` |
| Public site (Vercel) | https://toolcairn.neurynae.com | `TOOLPILOT_MODE=production` |
| Admin dashboard (Vercel) | https://admin-toolcairn.neurynae.com | `TOOLPILOT_MODE=production` |
| Staging | https://staging.neurynae.com | `TOOLPILOT_MODE=staging` |
| Production API | https://api.neurynae.com | `TOOLPILOT_MODE=production` |
| Worker (CF edge) | https://api.neurynae.com | routes through CF Worker |
| Origin (direct) | https://origin.neurynae.com | bypasses CF, VPS direct |

## Deployment Commands

```bash
# Public site (apps/public) — Vercel auto-deploys on push to main
# Manual deploy: cd apps/public && vercel deploy --prod --yes
# Project: toolcairn-public | Vercel team: anmolrajsoni15s-projects
# Ignore command: npx turbo-ignore @toolpilot/public

# API — Docker image build + push + VPS pull
docker build -t ghcr.io/neurynae/toolcairn-api:latest -f apps/api/Dockerfile .
docker push ghcr.io/neurynae/toolcairn-api:latest
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod pull && docker compose --env-file .env.prod up -d api"

# Cloudflare Worker
cd apps/worker && wrangler deploy

# npm package — bump version then push tag (triggers CI)
cd apps/mcp-server && npm version patch  # or minor/major
git push && git push --tags

# Indexer — run on VPS
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod run --rm indexer"
```

## Infrastructure

- **VPS**: AWS EC2 t3.medium, Mumbai (ap-south-1), IP: 3.111.95.28
- **User**: `deploy` (non-root, docker group)
- **Domain**: `neurynae.com` (Cloudflare DNS)
- **Reverse proxy**: Caddy (auto TLS via Let's Encrypt)
- **Container registry**: GitHub Container Registry (GHCR) — `ghcr.io/neurynae/`
- **CF Account**: Cloudflare (Worker: `toolcairn-api`, KV namespace for rate limiting)
- **GitHub Org**: NEURYNAE/ToolCairn

## New Packages / Apps

- `apps/api` — Express/Fastify API server (deployed to VPS)
- `apps/worker` — Cloudflare Worker (rate limiting, caching, routing)
- `packages/tools` — Shared MCP tool definitions
- `packages/remote` — Remote MCP client for npm package

## Secret Management

| Secret | Where |
|--------|-------|
| `DATABASE_URL`, `MEMGRAPH_*`, `QDRANT_*` | VPS `.env.prod` |
| `ORIGIN_SECRET` | CF Worker secret (`wrangler secret put`) + VPS `.env.prod` |
| `API_ORIGIN_URL` | CF Worker secret — set to `https://origin.neurynae.com` |
| `VPS_HOST`, `VPS_SSH_KEY` | GitHub Secrets (CI/CD) |
| `NPM_TOKEN` | GitHub Secrets (npm publish CI) |
| `GHCR_TOKEN` | GitHub Secrets (Docker push CI) |
| `TOOLPILOT_API_KEY` | Vercel env (toolcairn-public) — UUID for CF Worker auth |
| `TOOLPILOT_API_URL` | Vercel env (toolcairn-public) — `https://api.neurynae.com` |
| `NEXT_PUBLIC_APP_URL` | Vercel env (toolcairn-public) — `https://toolcairn.neurynae.com` |
| `NOMIC_API_KEY` | apps/public `.env.local` + Vercel env (for vector search) |

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://api.neurynae.com/v1/health` | CF Worker → VPS health (public) |
| `https://origin.neurynae.com/v1/health` | VPS API direct health |
| `https://staging.neurynae.com/v1/health` | Staging API health |
| `http://localhost:3001/v1/health` | Local dev health |
| `http://localhost:6333/healthz` | Local Qdrant health |
