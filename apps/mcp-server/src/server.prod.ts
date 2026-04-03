/**
 * Production MCP server — thin HTTP bridge.
 *
 * LOCAL tools (classify_prompt, *_config, toolpilot_init) run directly.
 * All other tools make a single HTTP call to the ToolPilot API via ToolPilotClient.
 *
 * This file is used when TOOLPILOT_MODE=production (npx @toolpilot/mcp).
 * It intentionally imports NOTHING from @toolpilot/graph, @toolpilot/search,
 * @toolpilot/vector, @toolpilot/db, or @toolpilot/queue so those packages
 * are not bundled into the published npm package.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '@toolpilot/config';
import { ToolPilotClient, loadOrCreateCredentials } from '@toolpilot/remote';
import {
  handleClassifyPrompt,
  handleInitProjectConfig,
  handleReadProjectConfig,
  handleToolpilotInit,
  handleUpdateProjectConfig,
} from '@toolpilot/tools';
import {
  checkCompatibilitySchema,
  checkIssueSchema,
  classifyPromptSchema,
  compareToolsSchema,
  getStackSchema,
  initProjectConfigSchema,
  readProjectConfigSchema,
  refineRequirementSchema,
  reportOutcomeSchema,
  searchToolsRespondSchema,
  searchToolsSchema,
  suggestGraphUpdateSchema,
  toolpilotInitSchema,
  updateProjectConfigSchema,
  verifySuggestionSchema,
} from '@toolpilot/tools';
import pino from 'pino';
import { withEventLogging } from './middleware/event-logger.js';

const logger = pino({ name: '@toolpilot/mcp-server:prod' });

const SETUP_INSTRUCTIONS = `
# ToolPilot — Agent Setup Instructions

You are connected to the ToolPilot MCP server. ToolPilot is your active tool intelligence co-pilot.

## On Every Session Start — Do This First

Check whether \`.toolpilot/config.json\` exists in the project root.

### If it does NOT exist (new project or first-time setup):
1. List the project root files (package.json, requirements.txt, CLAUDE.md, .cursorrules, .mcp.json, etc.)
2. Call \`toolpilot_init\` with your agent type, project root path, and the list of detected files.
3. Call \`init_project_config\` — pass your project name, language, framework, and any tools you can detect.
4. Write the returned \`config_json\` to \`.toolpilot/config.json\`.

### If it DOES exist (returning to an existing project):
1. Read \`.toolpilot/config.json\` and call \`read_project_config\` with its content.
2. If \`stale_tools\` is non-empty, inform the user and offer to re-verify those tools.
3. If \`pending_evaluation\` is non-empty, offer to run \`search_tools\` or \`compare_tools\` to resolve them.

## When to Use ToolPilot Tools

| Situation | Tool to call |
|-----------|-------------|
| User asks which tool to use for X | \`classify_prompt\` → \`refine_requirement\` → \`search_tools\` |
| User needs to compare two tools | \`compare_tools\` |
| User asks if tool A works with tool B | \`check_compatibility\` |
| Error persists after 4+ retries AND docs checked | \`check_issue\` |
| User asks for a recommended stack | \`get_stack\` |
| search_tools returns empty or low confidence | \`verify_suggestion\` |
| You discover a new tool relationship | \`suggest_graph_update\` |
| A tool worked well or was replaced | \`report_outcome\` |
| Tool added/removed from project | \`update_project_config\` |
`.trim();

export async function buildProdServer(): Promise<McpServer> {
  // Load or create anonymous API key
  const creds = await loadOrCreateCredentials();
  const remote = new ToolPilotClient({
    baseUrl: config.TOOLPILOT_API_URL,
    apiKey: creds.client_id,
  });

  logger.info(
    { apiUrl: config.TOOLPILOT_API_URL, clientId: creds.client_id.slice(0, 8) + '...' },
    'Production MCP mode: connecting to remote API',
  );

  const server = new McpServer(
    { name: 'toolpilot', version: '0.1.0' },
    { instructions: SETUP_INSTRUCTIONS },
  );

  // ── LOCAL tools (zero network, run on user's machine) ──────────────────────

  server.registerTool(
    'classify_prompt',
    {
      description:
        'Classify a developer prompt to determine if ToolPilot tool search is needed. Returns a structured classification prompt for the agent to evaluate.',
      inputSchema: classifyPromptSchema,
    },
    withEventLogging('classify_prompt', async (args) => handleClassifyPrompt(args)),
  );

  server.registerTool(
    'toolpilot_init',
    {
      description:
        'Set up ToolPilot integration for the current project. Generates agent instruction content, MCP config entry, and project config initializer.',
      inputSchema: toolpilotInitSchema,
    },
    withEventLogging('toolpilot_init', async (args) => handleToolpilotInit(args)),
  );

  server.registerTool(
    'init_project_config',
    {
      description:
        'Initialize a .toolpilot/config.json file for the current project. Returns the config JSON for the agent to write to disk.',
      inputSchema: initProjectConfigSchema,
    },
    withEventLogging('init_project_config', async (args) => handleInitProjectConfig(args)),
  );

  server.registerTool(
    'read_project_config',
    {
      description:
        'Parse and validate a .toolpilot/config.json file. Returns confirmed tools, pending evaluations, stale tools, and agent instructions.',
      inputSchema: readProjectConfigSchema,
    },
    withEventLogging('read_project_config', async (args) => handleReadProjectConfig(args)),
  );

  server.registerTool(
    'update_project_config',
    {
      description:
        'Apply a mutation to .toolpilot/config.json and return the updated content. Actions: add_tool, remove_tool, update_tool, add_evaluation.',
      inputSchema: updateProjectConfigSchema,
    },
    withEventLogging('update_project_config', async (args) => handleUpdateProjectConfig(args)),
  );

  // ── REMOTE tools (one HTTP call each to ToolPilot API) ────────────────────

  server.registerTool(
    'search_tools',
    {
      description:
        'Search for the best tool for a specific need using a natural language query. Initiates a guided discovery session with clarification questions when needed.',
      inputSchema: searchToolsSchema,
    },
    withEventLogging('search_tools', async (args) => remote.searchTools(args)),
  );

  server.registerTool(
    'search_tools_respond',
    {
      description:
        'Submit clarification answers for an in-progress tool search session and receive refined results.',
      inputSchema: searchToolsRespondSchema,
    },
    withEventLogging('search_tools_respond', async (args) => remote.searchToolsRespond(args)),
  );

  server.registerTool(
    'get_stack',
    {
      description:
        'Get a recommended tool stack for a specific use case with optional deployment and language constraints.',
      inputSchema: getStackSchema,
    },
    withEventLogging('get_stack', async (args) => remote.getStack(args)),
  );

  server.registerTool(
    'check_compatibility',
    {
      description:
        'Check compatibility between two tools. Returns direct graph relationships and inferred compatibility from shared neighbors.',
      inputSchema: checkCompatibilitySchema,
    },
    withEventLogging('check_compatibility', async (args) => remote.checkCompatibility(args)),
  );

  server.registerTool(
    'compare_tools',
    {
      description:
        'Compare two tools head-to-head using health signals, graph relationships, and community data.',
      inputSchema: compareToolsSchema,
    },
    withEventLogging('compare_tools', async (args) => remote.compareTools(args)),
  );

  server.registerTool(
    'refine_requirement',
    {
      description: 'Decompose a vague user use-case into specific, searchable tool requirements.',
      inputSchema: refineRequirementSchema,
    },
    withEventLogging('refine_requirement', async (args) => remote.refineRequirement(args)),
  );

  server.registerTool(
    'check_issue',
    {
      description:
        'LAST RESORT — check GitHub Issues for a known error after 4+ retries and docs review.',
      inputSchema: checkIssueSchema,
    },
    withEventLogging('check_issue', async (args) => remote.checkIssue(args)),
  );

  server.registerTool(
    'verify_suggestion',
    {
      description: 'Validate agent-suggested tools against the ToolPilot graph.',
      inputSchema: verifySuggestionSchema,
    },
    withEventLogging('verify_suggestion', async (args) => remote.verifySuggestion(args)),
  );

  server.registerTool(
    'report_outcome',
    {
      description: 'Report the outcome of using a tool recommended by ToolPilot (fire-and-forget).',
      inputSchema: reportOutcomeSchema,
    },
    withEventLogging('report_outcome', async (args) => remote.reportOutcome(args)),
  );

  server.registerTool(
    'suggest_graph_update',
    {
      description:
        'Suggest a new tool, relationship, use case, or health update to the ToolPilot graph.',
      inputSchema: suggestGraphUpdateSchema,
    },
    withEventLogging('suggest_graph_update', async (args) => remote.suggestGraphUpdate(args)),
  );

  return server;
}
