---
name: test-toolpilot
description: Run the ToolPilot end-to-end QA test suite against live MCP tools. Executes all 12 real-life scenarios and writes a timestamped report to ToolPilot_Real_Test/reports/.
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, mcp__toolpilot__search_tools, mcp__toolpilot__search_tools_respond, mcp__toolpilot__classify_prompt, mcp__toolpilot__refine_requirement, mcp__toolpilot__compare_tools, mcp__toolpilot__check_compatibility, mcp__toolpilot__check_issue, mcp__toolpilot__get_stack, mcp__toolpilot__suggest_graph_update, mcp__toolpilot__report_outcome, mcp__toolpilot__toolpilot_init, mcp__toolpilot__init_project_config, mcp__toolpilot__read_project_config, mcp__toolpilot__update_project_config
---

Run the ToolPilot real-life QA test suite.

## Pre-flight
1. Run `docker ps --filter name=toolpilot --format "table {{.Names}}\t{{.Status}}"` — confirm all 5 services are Up
2. Call `mcp__toolpilot__search_tools` with `query: "vector database"` — confirm `ok: true`
3. If either check fails, stop and report infrastructure status

## Execution
Read each scenario file in `ToolPilot_Real_Test/scenarios/` in order (01–12) and execute it.
Follow the steps and assertions in each file exactly.

If $ARGUMENTS is one of: `search`, `config`, `graph` — run only those scenarios:
- `search` → scenarios 01, 02, 03
- `config` → scenarios 04, 05, 06
- `graph` → scenarios 07, 08, 09, 10, 11, 12

## Output
Write the full report to `ToolPilot_Real_Test/reports/YYYY-MM-DD_HH-MM.md`.
Print terminal summary: "QA complete: X PASS · Y FAIL · Z WARN"
