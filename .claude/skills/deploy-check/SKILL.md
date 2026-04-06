---
name: deploy-check
description: Full pre-deployment verification checklist — lint, build, tests, Docker build, git state, and health
user-invocable: true
allowed-tools: Bash, Read, Glob
---

Full pre-deployment checklist. Run each step and report pass/fail. Stop deployment if any step fails.

## 1. Git State

```bash
# Must be on main
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"
[ "$BRANCH" = "main" ] || echo "FAIL: Not on main branch"

# No uncommitted changes
git status --short
git fetch origin main --quiet
git status -sb
```

Expected: on `main`, no uncommitted changes, no divergence from remote.

## 2. Code Quality

```bash
pnpm lint
```
Expected: no lint errors. Warnings are OK.

## 3. TypeScript Build

```bash
pnpm build
```
Expected: all packages build with no type errors.

## 4. Unit Tests

```bash
pnpm test:unit
```
Expected: all unit tests pass.

## 5. Integration Tests (requires Docker infra)

```bash
# Check Docker infra is up first
docker compose ps --format "table {{.Name}}\t{{.Status}}" | grep -E "(memgraph|qdrant|postgres|redis)"
pnpm test:integration
```
Skip this step if Docker infra is not running — note it in the report.

## 6. Docker Build Check

```bash
# Verify API Dockerfile builds successfully (dry run with --check flag)
docker build --check -f apps/api/Dockerfile . 2>/dev/null || \
docker build -t toolcairn-api:check-only -f apps/api/Dockerfile . --quiet
echo "Docker build: $?"
```
Expected: exit code 0.

## 7. Dependency Audit

```bash
# Check for high/critical vulnerabilities
pnpm audit --audit-level high 2>/dev/null | tail -5
```
Block if any critical vulnerabilities found.

## 8. Environment Variable Sanity

```bash
# Verify no .env files are staged
git diff --cached --name-only | grep -E "\.env" && echo "FAIL: .env file staged for commit" || echo "No .env files staged: OK"
```

## Summary Report

Print a table:

| Check | Status |
|-------|--------|
| Branch (main) | PASS/FAIL |
| No uncommitted changes | PASS/FAIL |
| Lint | PASS/FAIL |
| TypeScript build | PASS/FAIL |
| Unit tests | PASS/FAIL |
| Integration tests | PASS/SKIP/FAIL |
| Docker build | PASS/FAIL |
| Dependency audit | PASS/WARN/FAIL |
| No .env staged | PASS/FAIL |

**PROCEED** only if all checks are PASS (or SKIP for optional steps).
**BLOCK** if any check is FAIL.
