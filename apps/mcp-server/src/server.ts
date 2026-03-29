import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withEventLogging } from './middleware/event-logger.js';
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
} from './schemas.js';
import { handleCheckCompatibility } from './tools/check-compatibility.js';
import { handleCheckIssue } from './tools/check-issue.js';
import { handleClassifyPrompt } from './tools/classify-prompt.js';
import { handleCompareTools } from './tools/compare-tools.js';
import { handleGetStack } from './tools/get-stack.js';
import { handleInitProjectConfig } from './tools/init-project-config.js';
import { handleReadProjectConfig } from './tools/read-project-config.js';
import { handleRefineRequirement } from './tools/refine-requirement.js';
import { handleReportOutcome } from './tools/report-outcome.js';
import { handleSearchToolsRespond } from './tools/search-tools-respond.js';
import { handleSearchTools } from './tools/search-tools.js';
import { handleSuggestGraphUpdate } from './tools/suggest-graph-update.js';
import { handleToolpilotInit } from './tools/toolpilot-init.js';
import { handleUpdateProjectConfig } from './tools/update-project-config.js';

export function buildServer(): McpServer {
  const server = new McpServer({
    name: 'toolpilot',
    version: '0.0.1',
  });

  // ─── Core Search ───────────────────────────────────────────────────────────

  server.registerTool(
    'search_tools',
    {
      description:
        'Search for the best tool for a specific need using a natural language query. Initiates a guided discovery session with clarification questions when needed. Always prefer this over training-data guesses for tool selection.',
      inputSchema: searchToolsSchema,
    },
    withEventLogging('search_tools', async (args) => handleSearchTools(args)),
  );

  server.registerTool(
    'search_tools_respond',
    {
      description:
        'Submit clarification answers for an in-progress tool search session and receive refined results.',
      inputSchema: searchToolsRespondSchema,
    },
    withEventLogging('search_tools_respond', async (args) => handleSearchToolsRespond(args)),
  );

  server.registerTool(
    'get_stack',
    {
      description:
        'Get a recommended tool stack for a specific use case with optional deployment and language constraints.',
      inputSchema: getStackSchema,
    },
    withEventLogging('get_stack', async (args) => handleGetStack(args)),
  );

  // ─── Feedback & Intelligence ────────────────────────────────────────────────

  server.registerTool(
    'report_outcome',
    {
      description:
        'Report the outcome of using a tool recommended by ToolPilot. Used to improve future recommendations and update graph weights.',
      inputSchema: reportOutcomeSchema,
    },
    withEventLogging('report_outcome', async (args) => handleReportOutcome(args)),
  );

  server.registerTool(
    'check_issue',
    {
      description:
        'Check if a known GitHub issue matches an error or problem you are encountering with a tool. Searches the issue intelligence database before you fall into a debug loop.',
      inputSchema: checkIssueSchema,
    },
    withEventLogging('check_issue', async (args) => handleCheckIssue(args)),
  );

  server.registerTool(
    'check_compatibility',
    {
      description:
        'Check compatibility between two tools. Returns direct graph relationships (COMPATIBLE_WITH, CONFLICTS_WITH, REQUIRES) and inferred compatibility from shared neighbors.',
      inputSchema: checkCompatibilitySchema,
    },
    withEventLogging('check_compatibility', async (args) => handleCheckCompatibility(args)),
  );

  server.registerTool(
    'compare_tools',
    {
      description:
        'Compare two tools head-to-head using health signals, graph relationships, and community data. Handles cases where one or both tools are not yet indexed (triggers async indexing). Returns a structured recommendation with all 4 decision cases (accept/override × A better/B better).',
      inputSchema: compareToolsSchema,
    },
    withEventLogging('compare_tools', async (args) => handleCompareTools(args)),
  );

  // ─── Prompt Refinement ─────────────────────────────────────────────────────

  server.registerTool(
    'classify_prompt',
    {
      description:
        'Classify a developer prompt to determine if ToolPilot tool search is needed. Returns a structured classification prompt for the agent to evaluate. Call this before search_tools when a user describes a general task — it avoids unnecessary searches for debugging or general coding questions.',
      inputSchema: classifyPromptSchema,
    },
    withEventLogging('classify_prompt', async (args) => handleClassifyPrompt(args)),
  );

  server.registerTool(
    'refine_requirement',
    {
      description:
        'Decompose a vague user use-case into specific, searchable tool requirements. Returns a structured decomposition prompt for the agent, plus inferred tool categories and ready-to-use search queries for each need. Call this after classify_prompt returns tool_discovery, stack_building, or tool_comparison.',
      inputSchema: refineRequirementSchema,
    },
    withEventLogging('refine_requirement', async (args) => handleRefineRequirement(args)),
  );

  // ─── Project Setup ─────────────────────────────────────────────────────────

  server.registerTool(
    'toolpilot_init',
    {
      description:
        'Set up ToolPilot integration for the current project. Generates agent instruction content (CLAUDE.md, .cursorrules, etc.), MCP config entry, and project config initializer. Run once when starting a new project or onboarding ToolPilot to an existing one.',
      inputSchema: toolpilotInitSchema,
    },
    withEventLogging('toolpilot_init', async (args) => handleToolpilotInit(args)),
  );

  // ─── Project Config ─────────────────────────────────────────────────────────

  server.registerTool(
    'init_project_config',
    {
      description:
        'Initialize a .toolpilot/config.json file for the current project. Returns the config JSON for the agent to write to disk. Optionally accepts auto-detected tools from package.json or requirements.txt.',
      inputSchema: initProjectConfigSchema,
    },
    withEventLogging('init_project_config', async (args) => handleInitProjectConfig(args)),
  );

  server.registerTool(
    'read_project_config',
    {
      description:
        'Parse and validate a .toolpilot/config.json file. Returns confirmed tools, pending evaluations, stale tools that may need re-checking, and agent instructions. Pass the file content as config_content.',
      inputSchema: readProjectConfigSchema,
    },
    withEventLogging('read_project_config', async (args) => handleReadProjectConfig(args)),
  );

  server.registerTool(
    'update_project_config',
    {
      description:
        'Apply a mutation to .toolpilot/config.json and return the updated content for the agent to write back to disk. Actions: add_tool, remove_tool, update_tool, add_evaluation.',
      inputSchema: updateProjectConfigSchema,
    },
    withEventLogging('update_project_config', async (args) => handleUpdateProjectConfig(args)),
  );

  // ─── Graph Growth ────────────────────────────────────────────────────────────

  server.registerTool(
    'suggest_graph_update',
    {
      description:
        'Suggest a new tool, relationship, use case, or health update to the ToolPilot graph. High-confidence edges (≥0.8) between already-indexed tools are graduated immediately. Others are staged for human review in the admin portal. Use this when you discover tools working together or when a tool is missing from the index.',
      inputSchema: suggestGraphUpdateSchema,
    },
    withEventLogging('suggest_graph_update', async (args) => handleSuggestGraphUpdate(args)),
  );

  return server;
}
