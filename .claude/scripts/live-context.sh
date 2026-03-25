#!/bin/bash
# Layer 3: Live Context Injection
# Runs at SessionStart — injects git state + Docker health before first user message.

cd /d/ToolPilot 2>/dev/null || cd "D:/ToolPilot" 2>/dev/null || exit 0

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMITS=$(git log --oneline -5 2>/dev/null || echo "no commits yet")
MODIFIED=$(git status --short 2>/dev/null | head -8 || echo "clean")
DOCKER=$(docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | tail -n +2)
if [ -z "$DOCKER" ]; then DOCKER="not running — use: pnpm db:up"; fi

jq -n \
  --arg branch "$BRANCH" \
  --arg commits "$COMMITS" \
  --arg modified "$MODIFIED" \
  --arg docker "$DOCKER" \
  '{
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: (
        "## Live Project Context (auto-injected at session start)\n" +
        "**Branch**: " + $branch + "\n\n" +
        "**Last 5 Commits**:\n" + $commits + "\n\n" +
        "**Modified Files**:\n" + (if $modified == "" then "clean" else $modified end) + "\n\n" +
        "**Docker Services**:\n" + $docker
      )
    }
  }' 2>/dev/null || true
