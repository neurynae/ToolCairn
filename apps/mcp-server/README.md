# @neurynae/toolcairn-mcp

**Find the right open source tool, every time.**

[![npm version](https://img.shields.io/npm/v/@neurynae/toolcairn-mcp)](https://www.npmjs.com/package/@neurynae/toolcairn-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/NEURYNAE/ToolCairn/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@neurynae/toolcairn-mcp)](https://www.npmjs.com/package/@neurynae/toolcairn-mcp)

ToolCairn is an MCP server that helps AI agents and developers discover, compare, and evaluate open source tools. Search across 12,000+ indexed tools with natural language, get stack recommendations, check compatibility, and more — all directly from your AI agent.

---

## Quick Start

Add to your MCP config and restart your agent:

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

No API key required to get started.

---

## Setup by Client

### Claude Code

```bash
claude mcp add toolcairn -- npx @neurynae/toolcairn-mcp
```

Or add to `~/.claude/claude_desktop_config.json`:

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

## Available Tools

| Tool | What it does |
|------|-------------|
| `search_tools` | Search for the best tool for a specific need using natural language |
| `search_tools_respond` | Answer follow-up questions to refine search results |
| `get_stack` | Get a curated tool stack recommendation for a project |
| `compare_tools` | Compare two tools side by side |
| `check_compatibility` | Check if two tools are known to work together |
| `check_issue` | Look up known issues for a tool before spending time debugging |
| `report_outcome` | Report whether a recommended tool worked out |
| `refine_requirement` | Turn a vague requirement into a specific, searchable need |
| `verify_suggestion` | Validate a tool your agent suggested |
| `suggest_graph_update` | Suggest a new tool or relationship to add |
| `toolcairn_init` | Set up ToolCairn for the current project |
| `init_project_config` | Initialize project tool configuration |
| `read_project_config` | Read and validate existing project config |
| `update_project_config` | Add or remove tools from project config |
| `toolcairn_auth` | Sign in to unlock higher rate limits |

---

## Authentication

ToolCairn works out of the box with no sign-in — an anonymous session is created automatically on first run.

**Authenticated users** get higher rate limits. To sign in, ask your agent:

```
toolcairn_auth login
```

This opens a browser where you can sign in with Google, GitHub, or email. Once confirmed, all tools are authorized — no per-tool login needed.

```
toolcairn_auth status   # check current auth state
toolcairn_auth logout   # revert to anonymous
```

---

## Rate Limits

| | Requests / minute |
|---|---|
| Anonymous | 60 |
| Authenticated | 300 |

---

## Project Configuration

On first use, ToolCairn creates a `.toolcairn/config.json` file in your project. Your agent reads this to track which tools are confirmed for the project and avoids redundant searches on future sessions.

---

## Links

- **Website**: https://toolcairn.neurynae.com
- **Docs**: https://toolcairn.neurynae.com/docs
- **GitHub**: https://github.com/NEURYNAE/ToolCairn
- **Issues**: https://github.com/NEURYNAE/ToolCairn/issues

---

## License

MIT — © NEURYNAE
