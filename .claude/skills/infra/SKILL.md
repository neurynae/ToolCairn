---
name: infra
description: Check health of all infrastructure services — local Docker, VPS production, staging, CF Worker, and npm package
user-invocable: true
allowed-tools: Bash
---

Check all environments. Run each check and report status.

## Local Docker Services

```bash
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

Verify each service shows `(healthy)`:
- `toolpilot-memgraph-1`
- `toolpilot-qdrant-1`
- `toolpilot-postgres-1`
- `toolpilot-redis-1`

If any are down: `pnpm db:up` to start them.

### Local Service Probes

```bash
# Memgraph
docker compose exec memgraph mgconsole --execute "RETURN 1;" 2>/dev/null && echo "Memgraph: OK" || echo "Memgraph: FAIL"

# Qdrant
bash -c 'exec 3<>/dev/tcp/localhost/6333 && echo -e "GET /healthz HTTP/1.0\r\n\r\n" >&3 && head -1 <&3' 2>/dev/null | grep -q "200" && echo "Qdrant: OK" || echo "Qdrant: FAIL"

# PostgreSQL
docker compose exec postgres pg_isready 2>/dev/null && echo "PostgreSQL: OK" || echo "PostgreSQL: FAIL"

# Redis
docker compose exec redis redis-cli ping 2>/dev/null | grep -q "PONG" && echo "Redis: OK" || echo "Redis: FAIL"
```

## Production Environments

```bash
# CF Worker (public API)
WORKER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.neurynae.com/v1/health 2>/dev/null)
echo "CF Worker (api.neurynae.com): HTTP $WORKER_STATUS"

# VPS direct (origin)
ORIGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://origin.neurynae.com/v1/health 2>/dev/null)
echo "VPS Origin (origin.neurynae.com): HTTP $ORIGIN_STATUS"

# Staging
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://staging.neurynae.com/v1/health 2>/dev/null)
echo "Staging: HTTP $STAGING_STATUS"
```

## npm Package

```bash
NPM_VERSION=$(npm view @neurynae/toolcairn-mcp version 2>/dev/null || echo "not found")
LOCAL_VERSION=$(node -p "require('./apps/mcp-server/package.json').version" 2>/dev/null || echo "unknown")
echo "npm published: $NPM_VERSION | local: $LOCAL_VERSION"
```

## Report

Print a summary table:

| Service | Status | Notes |
|---------|--------|-------|
| Local Memgraph | ... | |
| Local Qdrant | ... | |
| Local PostgreSQL | ... | |
| Local Redis | ... | |
| CF Worker (prod) | HTTP ... | |
| VPS Origin | HTTP ... | |
| Staging | HTTP ... | |
| npm package | v... | |

If any service is down, suggest the exact fix command.
