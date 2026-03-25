---
name: deploy-check
description: Run pre-deployment verification checklist
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash
---

Pre-deployment checklist:

1. Lint: `pnpm lint`
2. Build: `pnpm build`
3. Unit tests: `pnpm test:unit`
4. Integration tests: `pnpm test:integration` (requires Docker infra)
5. Check for uncommitted changes: `git status`
6. Check branch is up to date: `git fetch && git status -sb`

Report pass/fail for each step. Block deployment if any step fails.
