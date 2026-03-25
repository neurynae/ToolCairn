---
name: test
description: Run tests intelligently based on what changed
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

Run tests for recent changes:

1. Identify changed files: `git diff --name-only HEAD`
2. For each changed `.ts` file, check if a colocated `.test.ts` exists
3. Run those specific tests: `pnpm test:unit -- <test-paths>`
4. If no specific tests found, run the full suite: `pnpm test`
5. Report results: passed, failed, coverage summary
6. If tests fail, identify the failure and suggest a fix

If $ARGUMENTS is provided, run tests for that specific path:
`pnpm test:unit -- $ARGUMENTS`
