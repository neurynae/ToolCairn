---
name: prod-deploy
description: Full production deployment — build Docker images, push to GHCR, deploy to VPS, verify health
user-invocable: true
allowed-tools: Bash, Read, Glob
---

Full production deployment workflow. Follow each step in order — stop and report if any step fails.

## Pre-flight Checks

```bash
# 1. Must be on main branch
git branch --show-current

# 2. No uncommitted changes
git status --short

# 3. In sync with remote
git fetch origin && git status -sb

# 4. All tests pass (run first if not recently run)
pnpm lint && pnpm build && pnpm test:unit
```

If any pre-flight check fails, stop and report the issue. Do NOT proceed.

## Build Docker Images

```bash
# Build API image (from monorepo root)
docker build \
  -t ghcr.io/neurynae/toolcairn-api:latest \
  -t ghcr.io/neurynae/toolcairn-api:$(git rev-parse --short HEAD) \
  -f apps/api/Dockerfile \
  .

# Build Indexer image
docker build \
  -t ghcr.io/neurynae/toolcairn-indexer:latest \
  -t ghcr.io/neurynae/toolcairn-indexer:$(git rev-parse --short HEAD) \
  -f apps/indexer/Dockerfile \
  .
```

## Push to GHCR

```bash
docker push ghcr.io/neurynae/toolcairn-api:latest
docker push ghcr.io/neurynae/toolcairn-api:$(git rev-parse --short HEAD)
docker push ghcr.io/neurynae/toolcairn-indexer:latest
docker push ghcr.io/neurynae/toolcairn-indexer:$(git rev-parse --short HEAD)
```

## Deploy to VPS

```bash
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod pull && docker compose --env-file .env.prod up -d api"
```

## Verify Health (wait 15s for container startup)

```bash
sleep 15
curl -s https://api.neurynae.com/v1/health
curl -s https://origin.neurynae.com/v1/health
ssh deploy@3.111.95.28 "docker compose --env-file .env.prod ps"
```

## Rollback (if health check fails)

```bash
# Roll back to previous image tag
PREV_SHA=$(git rev-parse --short HEAD~1)
ssh deploy@3.111.95.28 "cd ~/toolcairn && docker compose --env-file .env.prod stop api && docker run -d --name toolcairn-api ghcr.io/neurynae/toolcairn-api:${PREV_SHA}"
```

Report the final status with: deployed SHA, health check results, and container status.
