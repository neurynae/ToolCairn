---
name: seed
description: Seed the graph database with initial tool data
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash
---

Seed the ToolPilot database:

1. Ensure Docker infra is running: `docker compose ps`
2. If not running: `pnpm db:up` and wait for health checks
3. Run Memgraph schema initialization: `pnpm db:seed`
4. Run the indexer for initial tools: `pnpm indexer:run`
5. Verify: query Memgraph for tool count via Bolt
6. Report: number of tools, edges, and embeddings created
