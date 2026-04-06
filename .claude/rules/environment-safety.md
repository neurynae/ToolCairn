---
description: Environment isolation and secret safety rules — applies everywhere
globs:
  - "**"
---

# Environment Safety Rules

## Secrets — Never Commit

- `.env.prod`, `.env.local`, `.env.production`, `.env*.local` are git-ignored — never stage them
- Never hardcode tokens, API keys, passwords, or connection strings in source files
- If you spot a secret in code, flag it immediately before making any other change
- GitHub Secrets (CI), wrangler secrets (CF Worker), and VPS `.env.prod` are the only valid secret stores

## Environment Isolation

- `TOOLPILOT_MODE` controls which backend is targeted — always verify it matches your intent before running commands
- Local dev changes MUST NOT affect production — never point local tools at `origin.neurynae.com` directly
- Production changes require staging verification first: deploy to staging, verify health, then promote

## Destructive Operations — Require Explicit Confirmation

Always confirm with the user before running:
- `docker compose down` — stops ALL services (data at risk if volumes unmounted)
- `docker volume rm` — permanently destroys persistent data (Memgraph, Postgres, Qdrant, Redis)
- `docker system prune` — removes all unused images, containers, volumes
- `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` — irreversible data loss
- `git push --force` to `main` — rewrites shared history
- `wrangler secret delete` — breaks CF Worker routing
- `npm unpublish` — cannot unpublish once installed by users (npm policy: 72h window)

## CF Worker Safety

- `wrangler secret delete API_ORIGIN_URL` or `ORIGIN_SECRET` will break all client traffic — confirm first
- Always verify Worker health after `wrangler deploy`: `curl https://api.neurynae.com/v1/health`

## Env File Modifications

- Any edit to `.env*` files must be reviewed: verify no secret has been accidentally added to a tracked file
- After editing `.env*`, run `git status` to confirm the file remains untracked/ignored
