---
name: review
description: Run a full code review on recent changes
user-invocable: true
context: fork
agent: code-reviewer
---

Review all changes since the last commit:

1. Run `git diff HEAD` to see unstaged changes
2. Run `git diff --cached` to see staged changes
3. If no uncommitted changes, review the last commit: `git diff HEAD~1`
4. Apply the full review process from your instructions
5. Report findings organized by severity
