---
name: npm-release
description: Bump npm package version, create git tag, push to trigger CI publish to npmjs.com
user-invocable: true
allowed-tools: Bash, Read, Edit
---

Publish a new version of `@neurynae/toolcairn-mcp` to npm. The CI workflow handles the actual publish — this skill creates the correct tag that triggers it.

> **Monorepo note:** Never use `npm version` without `--no-git-tag-version` in this repo.
> Running `npm version` in a subdirectory creates the tag on the wrong commit or not at all.
> Always commit from the root, then tag manually.

## Pre-flight

```bash
# Must be on main with a clean working tree
git branch --show-current      # should be: main
git status --short             # should be empty

# Check current local version
node -p "require('./apps/mcp-server/package.json').version"

# Check what's live on npm
npm view @neurynae/toolcairn-mcp version 2>/dev/null || echo "not published yet"

# Confirm lint and typecheck pass before releasing
pnpm lint
pnpm --filter @neurynae/toolcairn-mcp typecheck
```

## Choose Bump Type

Ask the user which bump type if not specified:

- `patch` — bug fixes, docs, no new features (0.2.0 → 0.2.1)
- `minor` — new features, backward-compatible (0.2.0 → 0.3.0)
- `major` — breaking changes (0.2.0 → 1.0.0)

## Bump Version

```bash
# Step 1: Update package.json ONLY — no git commit, no tag
cd apps/mcp-server
npm version <patch|minor|major> --no-git-tag-version
cd ../..

# Step 2: Read the new version
NEW_VERSION=$(node -p "require('./apps/mcp-server/package.json').version")
echo "New version: $NEW_VERSION"

# Step 3: Commit from repo root (important — not from subdirectory)
git add apps/mcp-server/package.json
git commit -m "chore(mcp-server): bump to v${NEW_VERSION}"

# Step 4: Create tag at repo root pointing to that commit
git tag "v${NEW_VERSION}"

# Step 5: Push commit + tag
git push origin main
git push origin "v${NEW_VERSION}"
```

## What Happens Next

The GitHub Actions workflow `.github/workflows/publish.yml` detects the `v*` tag and:
1. Builds all workspace packages in dependency order
2. Runs `npm publish --access public` from `apps/mcp-server`
3. Publishes `@neurynae/toolcairn-mcp@<version>` to npmjs.com

## Verify (~3-4 min after tag push)

```bash
npm view @neurynae/toolcairn-mcp version
# Should match the version just published

# Also check the GitHub Actions tab:
# https://github.com/NEURYNAE/ToolCairn/actions/workflows/publish.yml
```

Report the new version number, the git tag, and the npm package URL:
`https://www.npmjs.com/package/@neurynae/toolcairn-mcp`
