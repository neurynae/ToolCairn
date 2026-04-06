---
description: Deployment rules for Docker, CI/CD, and npm publishing — applies to API, Worker, and GitHub workflows
globs:
  - "apps/api/**"
  - "apps/worker/**"
  - "docker-compose*.yml"
  - ".github/workflows/**"
---

# Deployment Rules

## Docker Compose

- Always use `--env-file .env.prod` on VPS: `docker compose --env-file .env.prod up -d`
- COPY source BEFORE `pnpm install` in Dockerfiles (cache invalidation order matters)
- Build order: `config` → `core` → `db` → `vector` → `graph` → `queue` → `search` → `tools` → `api`
- Do NOT use `--mount=type=cache` in Dockerfiles (incompatible with GHCR multi-arch builds)
- Tag images as `ghcr.io/neurynae/toolcairn-<service>:latest` and `:<git-sha>`

## Networking

- Never hardcode IPs (3.111.95.28) — use DNS names (`origin.neurynae.com`, `api.neurynae.com`)
- Cloudflare Workers cannot fetch raw IPs — always use the gray-cloud DNS record as origin URL
- `API_ORIGIN_URL` in the CF Worker must point to `https://origin.neurynae.com` (NOT the IP)

## Environment Variables

- `DATABASE_URL` passwords must be URL-encoded (special chars `@`, `#`, `%` break the DSN)
- `TOOLPILOT_MODE` must match the target environment (`dev` | `staging` | `production`)
- Never read secrets from `.env.prod` directly in code — use the validated config module

## npm Publishing

- Use `npm publish` NOT `pnpm publish` in CI (pnpm publish has workspace resolution issues)
- Scope: `@neurynae/toolcairn-mcp` — token must have access to `@neurynae` org on npmjs.com
- Bump version with `npm version patch|minor|major` — this creates the git tag automatically
- Push the tag to trigger the CI publish workflow: `git push && git push --tags`

## CI/CD (GitHub Actions)

- Never skip pre-commit hooks (`--no-verify`) — fix the underlying issue instead
- Docker build failures in CI are almost always build-order or COPY-order problems
- Prisma client generation must be a separate step (DLL lock conflict on Windows dev machines)
- Health check after deploy: always verify `https://api.neurynae.com/v1/health` returns 200
