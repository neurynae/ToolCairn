// ToolPilot MCP Server — Primary Product
// Exposes: search_tools, search_tools_respond, check_issue,
//          check_compatibility, report_outcome, get_stack
// Implemented in Phase 4
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'toolpilot',
  version: '0.0.1',
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
