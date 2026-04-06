---
name: test-toolpilot
description: Run the ToolPilot end-to-end QA simulation. Executes 5 real product-building scenarios (not unit tests) and writes a timestamped report to ToolPilot_Real_Test/reports/.
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, mcp__toolpilot__search_tools, mcp__toolpilot__search_tools_respond, mcp__toolpilot__classify_prompt, mcp__toolpilot__refine_requirement, mcp__toolpilot__compare_tools, mcp__toolpilot__check_compatibility, mcp__toolpilot__check_issue, mcp__toolpilot__get_stack, mcp__toolpilot__suggest_graph_update, mcp__toolpilot__report_outcome, mcp__toolpilot__toolpilot_init, mcp__toolpilot__init_project_config, mcp__toolpilot__read_project_config, mcp__toolpilot__update_project_config
---

Run the ToolPilot real-life QA simulation. These are product-building simulations, not unit tests.

## Pre-flight
1. `docker ps --filter name=toolpilot` — confirm all 5 services are Up
2. Call `mcp__toolpilot__search_tools` with `query: "vector database TypeScript"` — confirm `ok: true`
3. If either fails: write `ToolPilot_Real_Test/reports/INFRA_DOWN_<timestamp>.md` and stop

## Scenarios to run
Read and execute each scenario file from `ToolPilot_Real_Test/scenarios/` in order:

1. `01-new-saas-app-stack.md` — Developer picks tools for a new TypeScript SaaS
2. `02-debugging-production-error.md` — ioredis error in Lambda, compare alternatives
3. `03-migrating-existing-project.md` — Onboard ToolPilot to an existing project
4. `04-adding-realtime-feature.md` — Discover real-time tools for Next.js
5. `05-tool-replacement-and-graph-growth.md` — Jest→Vitest migration + Biome eval

If $ARGUMENTS is `search` → run 01, 04 only
If $ARGUMENTS is `config` → run 03 only
If $ARGUMENTS is `graph` → run 02, 05 only

## Output
Write report to `ToolPilot_Real_Test/reports/YYYY-MM-DD_HH-MM.md`.
Print: "QA complete: X PASS · Y FAIL · Z WARN"
