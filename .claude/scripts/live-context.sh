#!/bin/bash
# Layer 3: Live Context Injection
# Runs at SessionStart — injects git state + Docker health + prod status + project memory.

echo "[SessionStart] Live context script starting..." >&2

cd /d/ToolPilot 2>/dev/null || cd "D:/ToolPilot" 2>/dev/null || exit 0

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMITS=$(git log --oneline -5 2>/dev/null || echo "no commits yet")
MODIFIED=$(git status --short 2>/dev/null | head -8 || echo "clean")
DOCKER=$(docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | tail -n +2)
if [ -z "$DOCKER" ]; then DOCKER="not running — use: pnpm db:up"; fi

# npm package version
NPM_LOCAL=$(node -p "require('./apps/mcp-server/package.json').version" 2>/dev/null || echo "unknown")

# Production health (quick check, non-blocking, 3s timeout)
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 https://api.neurynae.com/v1/health 2>/dev/null || echo "timeout")

# Memory recall — read PRIMER.md for project state
MEMORY_DIR="/c/Users/ANMOL RAJ SONI/.claude/projects/D--ToolPilot/memory"
PRIMER=""
if [ -f "$MEMORY_DIR/PRIMER.md" ]; then
  PRIMER=$(cat "$MEMORY_DIR/PRIMER.md" 2>/dev/null || echo "")
fi

jq -n \
  --arg branch "$BRANCH" \
  --arg commits "$COMMITS" \
  --arg modified "$MODIFIED" \
  --arg docker "$DOCKER" \
  --arg npm_local "$NPM_LOCAL" \
  --arg prod_status "$PROD_STATUS" \
  --arg primer "$PRIMER" \
  '{
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: (
        "**[SessionStart] Live context script executed successfully**\n\n" +
        "**Branch**: " + $branch + "\n\n" +
        "**Last 5 Commits**:\n" + $commits + "\n\n" +
        "**Modified Files**:\n" + (if $modified == "" then "clean" else $modified end) + "\n\n" +
        "**Docker Services**:\n" + $docker + "\n\n" +
        "**npm package** (local): v" + $npm_local + "\n\n" +
        "**Production API** (api.neurynae.com): HTTP " + $prod_status + "\n\n" +
        (if $primer != "" then "---\n## Project Memory (PRIMER)\n\n" + $primer else "" end)
      )
    }
  }' 2>/dev/null || true

echo "[SessionStart] Live context script completed." >&2
