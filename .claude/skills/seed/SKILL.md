---
name: seed
description: Seed or re-seed the ToolCairn graph database — works for local dev and production indexer management
user-invocable: true
allowed-tools: Bash, Read
---

Seed the ToolCairn databases. First, determine the target environment:
- **local** — local Docker Compose (default)
- **production** — VPS via SSH

---

## Local Development Seed

```bash
# 1. Check Docker infra is running
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# If not running, start it
# pnpm db:up
# sleep 20  # wait for health checks

# 2. Run Prisma migrations (PostgreSQL schema)
npx prisma migrate dev --schema packages/db/prisma/schema.prisma

# 3. Run Memgraph schema + constraints seed
pnpm db:seed

# 4. Run initial tool indexer
pnpm indexer:run

# 5. Verify — query Memgraph for tool count
docker compose exec memgraph mgconsole --execute "MATCH (t:Tool) RETURN count(t) AS tools;"

# 6. Check Qdrant collection
bash -c 'exec 3<>/dev/tcp/localhost/6333 && echo -e "GET /collections/tools HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 && cat <&3' 2>/dev/null | python3 -c "import sys,json; d=json.loads(sys.stdin.read().split('\r\n\r\n',1)[1]); print('Qdrant points:', d['result']['points_count'])" 2>/dev/null
```

---

## Production Indexer Management

```bash
# Check last indexer run status
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod logs --tail=50 indexer 2>/dev/null || echo 'No indexer logs found'"

# Trigger indexer run on VPS
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod run --rm indexer"

# Monitor progress (tail logs in real time)
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod logs -f indexer"

# Verify production tool count
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod exec memgraph mgconsole --execute 'MATCH (t:Tool) RETURN count(t) AS tools;'"
```

---

## Re-seed from Scratch (Destructive — Confirm First)

```bash
# WARNING: This wipes all graph data
# Local only — never run on production without explicit confirmation

docker compose exec memgraph mgconsole --execute "MATCH (n) DETACH DELETE n;"
docker compose exec memgraph mgconsole --execute "DROP INDEX ON :Tool(slug);"
pnpm db:seed
pnpm indexer:run
```

---

Report: number of Tool nodes, edges, and Qdrant vectors created/updated.
