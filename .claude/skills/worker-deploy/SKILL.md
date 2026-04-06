---
name: worker-deploy
description: Deploy Cloudflare Worker for ToolCairn API gateway — rate limiting, caching, auth routing
user-invocable: true
allowed-tools: Bash, Read
---

Deploy the Cloudflare Worker (`apps/worker`) that routes `api.neurynae.com` → `origin.neurynae.com`.

## Pre-flight

```bash
# Verify wrangler is available
npx wrangler --version

# Check current Worker config
cat apps/worker/wrangler.toml 2>/dev/null || cat apps/worker/wrangler.jsonc 2>/dev/null

# Confirm secrets are set (list only — does NOT show values)
cd apps/worker && npx wrangler secret list
```

Secrets that must exist: `API_ORIGIN_URL`, `ORIGIN_SECRET`

## Deploy Worker

```bash
cd apps/worker
npx wrangler deploy
```

Expected output: `Deployed toolcairn-api` with a Workers URL.

## Set/Update Secrets (if needed)

```bash
cd apps/worker
# Only run these if the secret needs to be updated
npx wrangler secret put API_ORIGIN_URL   # enter: https://origin.neurynae.com
npx wrangler secret put ORIGIN_SECRET    # enter: value from .env.prod
```

**WARNING**: Never delete secrets without confirmation — it breaks all client traffic immediately.

## Verify After Deploy

```bash
# Health check through CF Worker
curl -s https://api.neurynae.com/v1/health

# Verify caching behavior (check CF-Cache-Status header)
curl -s -I https://api.neurynae.com/v1/health | grep -i "cf-cache"

# Test rate limiting header (should appear)
curl -s -I https://api.neurynae.com/v1/search | grep -i "x-ratelimit"
```

Expected: health returns 200, CF-Cache-Status is HIT or MISS (not ERROR).

## Rollback

Cloudflare keeps previous Worker versions. Roll back via the CF dashboard:
`dash.cloudflare.com` → Workers → `toolcairn-api` → Deployments → Rollback

Or re-deploy the previous commit:
```bash
git stash  # or checkout previous commit
cd apps/worker && npx wrangler deploy
```

Report: deployed version, health check result, cache header status.
