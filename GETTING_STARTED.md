# ToolPilot — Getting Started Guide

> Agent-first, graph-powered tool intelligence platform. MCP server (primary) + web interface (secondary) over Memgraph + Qdrant.

This guide covers everything from cloning the repository to running the full application stack.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Docker Infrastructure](#4-docker-infrastructure)
5. [Installing Dependencies](#5-installing-dependencies)
6. [Building the Project](#6-building-the-project)
7. [Running the Application](#7-running-the-application)
8. [Verifying the Setup](#8-verifying-the-setup)
9. [Common Workflows](#9-common-workflows)
10. [Project Structure](#10-project-structure)

---

## 1. Prerequisites

Ensure the following are installed on your machine:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 22 LTS | JavaScript runtime |
| **pnpm** | ≥ 9.0 | Package manager |
| **Docker** | Latest | Container runtime for infrastructure |
| **Docker Compose** | v2+ | Orchestrating Docker services |

### Verify installations

```bash
node --version   # should print v22.x.x
pnpm --version   # should print 9.x.x
docker --version  # Docker version 20.x.x or higher
docker compose version  # v2.x.x or higher
```

### Install pnpm if needed

```bash
npm install -g pnpm@9
```

---

## 2. Repository Setup

### Clone the repository

```bash
git clone <repository-url>
cd ToolPilot
```

### Install Node.js dependencies

```bash
pnpm install
```

This installs all workspace dependencies across the monorepo (apps and packages directories).

---

## 3. Environment Configuration

### Copy the example environment file

```bash
cp .env.example .env
```

### Required environment variables

The `.env` file contains all infrastructure connections. The defaults work for local development:

```bash
# Memgraph (Graph DB)
MEMGRAPH_URL=bolt://localhost:7687
MEMGRAPH_USER=
MEMGRAPH_PASSWORD=

# Qdrant (Vector Store)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# PostgreSQL (Staging + Sessions)
DATABASE_URL=postgresql://toolpilot:toolpilot@localhost:5432/toolpilot

# Redis (Queue)
REDIS_URL=redis://localhost:6379

# Nomic Embed Code (Embeddings)
NOMIC_API_KEY=          # Required for vector search to work

# GitHub (Indexer)
GITHUB_TOKEN=           # Required for GitHub indexer to work

# MCP Server
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=0.0.0.0

# Web App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_SECRET=change-me-in-production

# General
NODE_ENV=development
LOG_LEVEL=info
```

> **Important:** Never commit the `.env` file. It is already in `.gitignore`.

---

## 4. Docker Infrastructure

### Start all infrastructure services

```bash
pnpm db:up
```

This runs `docker compose up -d` and starts the following services:

| Service | Port | Purpose |
|---------|------|---------|
| **memgraph** | 7687 (Bolt), 7444 (SSL) | Graph database — stores tools, use cases, edges, and relationships |
| **memgraph-lab** | 3000 | Browser-based Memgraph visualization and query workbench |
| **qdrant** | 6333 (REST), 6334 (gRPC) | Vector database — stores embeddings for semantic search |
| **postgres** | 5432 | PostgreSQL 16 — staging layer, session storage |
| **redis** | 6379 | Redis 7 Streams — job queue for async operations |

### Verify services are healthy

```bash
docker compose ps
```

All services should show `Up` status. Health checks run automatically on memgraph, qdrant, postgres, and redis.

### View service logs

```bash
docker compose logs memgraph    # View Memgraph logs
docker compose logs qdrant      # View Qdrant logs
docker compose logs postgres    # View PostgreSQL logs
docker compose logs redis       # View Redis logs

# Follow logs in real-time
docker compose logs -f
```

### Stop infrastructure

```bash
pnpm db:down
```

This stops and removes containers but preserves volumes (data persists across restarts).

### Reset infrastructure (destroy volumes)

```bash
docker compose down -v     # Add -v to destroy volumes
pnpm db:up                  # Restart fresh
```

> **Warning:** Destroying volumes permanently deletes all data in Memgraph, Qdrant, PostgreSQL, and Redis.

---

## 5. Installing Dependencies

```bash
pnpm install
```

This uses Turborepo to install dependencies across all workspaces. You should see output for:
- `apps/mcp-server`
- `apps/web`
- `apps/indexer`
- `apps/public`
- `packages/core`
- `packages/config`
- `packages/db`
- `packages/graph`
- `packages/queue`
- `packages/search`
- `packages/vector`

---

## 6. Building the Project

### Build all packages

```bash
pnpm build
```

This uses Turborepo to build all packages in dependency order:
1. First, all `packages/*` (core, config, db, graph, queue, search, vector)
2. Then, all `apps/*` (mcp-server, web, indexer, public)

Each package's `build` script compiles TypeScript to JavaScript in the `dist/` directory.

### Build a specific package

```bash
pnpm --filter @toolpilot/mcp-server build
pnpm --filter @toolpilot/web build
```

### Clean build artifacts

```bash
pnpm clean
```

This removes all `dist/` directories and `node_modules` from packages.

### Type checking without building

```bash
pnpm typecheck
```

---

## 7. Running the Application

You can run all services together or individually.

### Option A: Run Everything Together (Recommended for Development)

```bash
pnpm dev
```

This runs `turbo run dev` and starts all apps concurrently:
- MCP server at `http://localhost:3001`
- Web app at `http://localhost:3000`
- Indexer (background worker)

### Option B: Run Services Individually

#### MCP Server (Primary Product)

The MCP server is the main product. Start it with:

```bash
# Development (with hot-reload)
cd apps/mcp-server && pnpm dev

# Production (compiled)
cd apps/mcp-server && pnpm build && pnpm start
```

The server runs on `http://localhost:3001` by default.

**Test the MCP server is running:**
```bash
curl http://localhost:3001/health
```

#### Web Interface

```bash
# Development (hot-reload)
cd apps/web && pnpm dev

# Production
cd apps/web && pnpm build && pnpm start
```

The web app runs on `http://localhost:3001` (note: same port as MCP server, different entry points).

#### GitHub Indexer

```bash
pnpm indexer:run
```

This starts the background worker that indexes GitHub repositories into the graph.

#### Database Seeding

Populate the graph with initial tool data:

```bash
pnpm db:seed
```

This runs the seeder in `packages/db`.

---

## 8. Verifying the Setup

### Check Docker services health

Navigate to each service's health endpoint:

- **Memgraph Lab** (visual graph browser): http://localhost:3000
- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **PostgreSQL**: Connect via `psql postgresql://toolpilot:toolpilot@localhost:5432/toolpilot`

### MCP Server tools

The MCP server exposes 14 tools. After starting the server, you can query it via the MCP protocol. The tools are:

| Tool | Purpose |
|------|---------|
| `search_tools` | Find the best tool for a need through guided discovery |
| `search_tools_respond` | Answer clarification questions in a guided search |
| `classify_prompt` | Classify if a prompt needs tool search |
| `refine_requirement` | Decompose vague requirements into specific tool needs |
| `compare_tools` | Compare two tools head-to-head |
| `check_compatibility` | Check if two tools are compatible |
| `check_issue` | Check if a GitHub issue matches an error |
| `get_stack` | Get a recommended tool stack for a use case |
| `suggest_graph_update` | Suggest a new tool or relationship to the graph |
| `report_outcome` | Report the outcome of using a recommended tool |
| `toolpilot_init` | Initialize ToolPilot for a specific agent |
| `init_project_config` | Initialize project config |
| `read_project_config` | Read project config |
| `update_project_config` | Update project config |

### Test the search flow

Connect the MCP server to an AI agent (Claude Code, Cursor, etc.) and try:

```
search_tools("I need a self-hostable vector database, Python, MIT license")
```

---

## 9. Common Workflows

### Full local development setup

```bash
# 1. Start Docker infrastructure
pnpm db:up

# 2. Wait for services to be healthy (about 10-20 seconds)
docker compose ps

# 3. Install dependencies (first time only)
pnpm install

# 4. Build all packages
pnpm build

# 5. Seed the database (first time only)
pnpm db:seed

# 6. Start all services in dev mode
pnpm dev
```

### Running tests

```bash
# All tests (unit + integration)
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# Tests for a specific package
pnpm --filter @toolpilot/mcp-server test:unit
```

### Linting

```bash
# Check for lint errors
pnpm lint

# Auto-fix lint errors
pnpm lint:fix
```

### Database migrations

```bash
# Run pending migrations
pnpm db:migrate
```

### Reset everything

```bash
# Stop all services
pnpm db:down

# Destroy all volumes (deletes all data)
docker compose down -v

# Restart fresh
pnpm db:up
sleep 10  # Wait for health checks
pnpm install
pnpm build
pnpm db:seed
pnpm dev
```

---

## 10. Project Structure

```
ToolPilot/
├── apps/
│   ├── mcp-server/          # MCP server — PRIMARY PRODUCT
│   │   └── src/
│   │       ├── index.ts         # Entry point
│   │       ├── server.ts         # Server setup
│   │       ├── transport.ts      # Transport layer
│   │       ├── schemas.ts        # Zod validation schemas
│   │       ├── tools/            # MCP tool handlers (14 tools)
│   │       │   ├── search-tools.ts
│   │       │   ├── check-issue.ts
│   │       │   ├── check-compatibility.ts
│   │       │   ├── compare-tools.ts
│   │       │   ├── report-outcome.ts
│   │       │   ├── get-stack.ts
│   │       │   ├── suggest-graph-update.ts
│   │       │   ├── classify-prompt.ts
│   │       │   ├── refine-requirement.ts
│   │       │   ├── search-tools-respond.ts
│   │       │   ├── toolpilot-init.ts
│   │       │   ├── init-project-config.ts
│   │       │   ├── read-project-config.ts
│   │       │   ├── update-project-config.ts
│   │       │   ├── format-results.ts
│   │       │   └── generate-tracker.ts
│   │       ├── middleware/       # Request/response middleware
│   │       │   └── event-logger.ts
│   │       ├── templates/        # Agent instruction templates
│   │       │   └── agent-instructions.ts
│   │       └── utils.ts
│   ├── web/                  # Next.js web interface
│   ├── indexer/              # GitHub indexer + workers
│   └── public/               # Public-facing app
├── packages/
│   ├── core/                 # Shared types, schemas, interfaces
│   ├── config/               # Environment config loader (Zod)
│   ├── db/                   # PostgreSQL (Prisma)
│   ├── graph/                # Memgraph client + Cypher queries
│   ├── vector/               # Qdrant + embeddings
│   ├── search/               # 4-stage search engine
│   └── queue/                # Redis Streams
├── docker-compose.yml        # Infrastructure services
├── .env.example              # Environment variable template
├── package.json              # Root package.json (pnpm workspace)
├── turbo.json                # Turborepo configuration
└── tsconfig.json             # TypeScript base config
```

### Key packages

| Package | Description |
|---------|-------------|
| `@toolpilot/graph` | Memgraph client with neo4j-driver. Handles all graph operations via Cypher queries. |
| `@toolpilot/vector` | Qdrant client with Nomic Embed Code 768d embeddings. Handles semantic search. |
| `@toolpilot/search` | 4-stage guided discovery search engine. |
| `@toolpilot/db` | Prisma client for PostgreSQL staging layer. |
| `@toolpilot/queue` | Redis Streams producer/consumer for async job processing. |
| `@toolpilot/config` | Validated config module — parses `.env` via Zod schema. |

---

## Troubleshooting

### Memgraph connection refused

Ensure the Memgraph container is running and healthy:

```bash
docker compose ps memgraph
docker compose logs memgraph
```

If unhealthy, restart:

```bash
docker compose restart memgraph
```

### Qdrant not responding

```bash
docker compose ps qdrant
docker compose logs qdrant
```

### PostgreSQL connection fails

```bash
docker compose ps postgres
docker compose logs postgres
```

Verify credentials match `.env`:
```
DATABASE_URL=postgresql://toolpilot:toolpilot@localhost:5432/toolpilot
```

### Port already in use

If port 3000, 3001, 6333, 7687, or 5432 is in use:

```bash
# Find what's using the port
netstat -ano | findstr :3001

# Kill the process or change the port in .env
```

### Build fails with missing packages

```bash
pnpm install
pnpm build
```

### MCP server not connecting to agents

Verify the MCP server is running:

```bash
curl http://localhost:3001/health
```

Check logs:

```bash
cd apps/mcp-server && pnpm dev
```

### Indexer not finding GitHub data

Ensure `GITHUB_TOKEN` is set in `.env`. Get a token at https://github.com/settings/tokens

---

## Next Steps

- Read [Product_Description_ToolPilot.md](./Product_Description_ToolPilot.md) for a deep dive into the product vision
- Read [CLAUDE.md](./CLAUDE.md) for development conventions and architecture details
- Explore the Obsidian vault at `ToolPilot Dev/` for design docs and ADRs
- Connect the MCP server to Claude Code, Cursor, or another MCP-compatible agent
