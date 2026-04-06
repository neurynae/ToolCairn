# @neurynae/toolcairn-mcp

**Graph-powered tool intelligence for AI agents and developers.**

[![npm version](https://img.shields.io/npm/v/@neurynae/toolcairn-mcp)](https://www.npmjs.com/package/@neurynae/toolcairn-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/NEURYNAE/ToolCairn/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@neurynae/toolcairn-mcp)](https://www.npmjs.com/package/@neurynae/toolcairn-mcp)

ToolCairn is an MCP (Model Context Protocol) server that gives your AI agent graph-powered tool intelligence. Search 12,000+ open source tools using a 4-stage pipeline combining BM25 keyword search, vector embeddings, and graph re-ranking — so your agent always recommends the *right* tool.

---

## Quick Start

No installation required. Add this to your MCP configuration and ToolCairn starts on the next session:

```json
{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}
```

---

## Installation by Client

### Claude Code (CLI)

Add to `~/.claude/claude_desktop_config.json` (or project `.mcp.json`):

```json
{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}
```

Or via the CLI:
```bash
claude mcp add toolcairn -- npx @neurynae/toolcairn-mcp
```

### Cursor

Open **Settings → MCP** and add:

```json
{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/settings.json` or user settings:

```json
{
  "github.copilot.chat.mcp.servers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"],
      "type": "stdio"
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}
```

### Custom / Other Clients

Any MCP-compatible client supporting stdio transport works:

```bash
npx @neurynae/toolcairn-mcp
```

---

## Authentication

ToolCairn works out of the box with no authentication — an anonymous API key is generated on first run and stored in `~/.toolpilot/credentials.json`.

**Authenticated users** get higher rate limits (300 req/min vs 60 req/min for anonymous).

To authenticate, ask your agent to run:

```
toolcairn_auth login
```

This opens your browser to `https://toolcairn.neurynae.com/device`, where you sign in with Google, GitHub, or email/password. Once confirmed, your agent is authenticated — no per-tool login needed.

Check auth status:
```
toolcairn_auth status
```

Log out:
```
toolcairn_auth logout
```

---

## Available Tools

| Tool | Description |
|------|-------------|
| `search_tools` | Natural-language tool search with guided clarification |
| `search_tools_respond` | Submit clarification answers to refine search results |
| `get_stack` | Full stack recommendation for a project description |
| `compare_tools` | Head-to-head comparison of two tools with health metrics |
| `check_compatibility` | Check if two tools are known to work together |
| `check_issue` | Look up known GitHub issues for a tool before debugging |
| `report_outcome` | Report whether a recommended tool worked (improves future results) |
| `refine_requirement` | Decompose a vague need into searchable tool requirements |
| `verify_suggestion` | Validate agent-suggested tools against the ToolCairn graph |
| `suggest_graph_update` | Contribute new tool relationships to the knowledge graph |
| `toolcairn_init` | Set up ToolCairn integration for the current project |
| `init_project_config` | Initialize `.toolcairn/config.json` for the project |
| `read_project_config` | Read and validate the project's tool configuration |
| `update_project_config` | Add or remove tools from the project config |
| `toolcairn_auth` | Authenticate with ToolCairn (login / status / logout) |

---

## How It Works

ToolCairn uses a **4-stage search pipeline**:

1. **Hybrid Search** — BM25 keyword matching + vector embeddings search 12,000+ indexed tools in parallel
2. **Graph Re-ranking** — A knowledge graph (Memgraph) re-ranks candidates using ecosystem relationships: integrations, alternatives, co-occurrence signals
3. **Clarification** — When queries are ambiguous, targeted follow-up questions narrow the results
4. **Final Selection** — Returns the top 1–2 tools with confidence scores, reasons, and documentation links

---

## Project Configuration

On first run, ToolCairn creates `.toolcairn/config.json` in your project root. Your agent reads this file to understand which tools are already confirmed for the project and avoids redundant searches.

```json
{
  "project": {
    "name": "my-project",
    "language": "TypeScript",
    "framework": "Next.js"
  },
  "confirmed_tools": ["next", "prisma", "tailwindcss"],
  "pending_evaluation": [],
  "stale_tools": []
}
```

---

## Rate Limits

| Tier | Rate Limit |
|------|-----------|
| Anonymous (default) | 60 requests / minute |
| Authenticated | 300 requests / minute |

Rate limits are per API key, enforced at the Cloudflare edge.

---

## Links

- **Website**: https://toolcairn.neurynae.com
- **Docs**: https://toolcairn.neurynae.com/docs
- **GitHub**: https://github.com/NEURYNAE/ToolCairn
- **npm**: https://www.npmjs.com/package/@neurynae/toolcairn-mcp
- **Issues**: https://github.com/NEURYNAE/ToolCairn/issues

---

## License

MIT — © NEURYNAE
