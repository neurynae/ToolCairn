---
paths: ["apps/mcp-server/**"]
---
# MCP Server Rules
- All tool handlers must validate input with Zod schemas
- Return structured JSON matching product doc schema
- Every handler must handle session state via query_id
- Log all tool invocations with pino
- Never block on async operations — queue them via Redis Streams
