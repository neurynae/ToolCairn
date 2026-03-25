---
name: fix-issue
description: Fix a specific GitHub issue end-to-end
user-invocable: true
argument-hint: "[issue-number]"
---

Fix GitHub issue #$ARGUMENTS:

1. Get issue details: use the GitHub MCP to read issue #$ARGUMENTS
2. Understand the requirements and acceptance criteria
3. Research the relevant code using Grep and Read
4. Implement the fix with minimal changes
5. Write or update tests for the change
6. Run tests: `pnpm test`
7. Run lint: `pnpm lint`
8. Create a commit: `git add -A && git commit -m "fix: resolve issue #$ARGUMENTS"`
9. Report what was changed and why
