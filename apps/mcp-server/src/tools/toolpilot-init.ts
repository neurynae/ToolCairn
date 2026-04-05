import pino from 'pino';
import {
  type AgentType,
  getInstructionsForAgent,
  getMcpConfigEntry,
  getOpenCodeMcpEntry,
} from '../templates/agent-instructions.js';
import { errResult, okResult } from '../utils.js';
import { generateTrackerHtml } from './generate-tracker.js';

const logger = pino({ name: '@toolcairn/mcp-server:toolpilot-init' });

export async function handleToolpilotInit(args: {
  agent: AgentType;
  project_root: string;
  server_path?: string;
  detected_files?: string[];
}) {
  try {
    logger.info({ agent: args.agent, project_root: args.project_root }, 'toolcairn_init called');

    const instructions = getInstructionsForAgent(args.agent);
    // OpenCode uses opencode.json "mcp" key format; all other agents use .mcp.json
    const isOpenCode = args.agent === 'opencode';
    const mcpConfigEntry = isOpenCode
      ? getOpenCodeMcpEntry(args.server_path)
      : getMcpConfigEntry(args.server_path);
    const mcpConfigFile = isOpenCode ? 'opencode.json' : '.mcp.json';

    // Determine if the agent's MCP config file already exists based on detected files
    const hasMcpJson = args.detected_files?.some(
      (f) => f === mcpConfigFile || f.endsWith(`/${mcpConfigFile}`),
    );
    const hasInstructionFile = args.detected_files?.some((f) => f.endsWith(instructions.file_path));
    const hasToolpilotConfig = args.detected_files?.some((f) =>
      f.includes('.toolcairn/config.json'),
    );
    const hasTrackerHtml = args.detected_files?.some((f) => f.includes('.toolcairn/tracker.html'));

    // Default events path: <project_root>/.toolcairn/events.jsonl
    const eventsPath = `${args.project_root}/.toolcairn/events.jsonl`;

    const setupSteps: Array<{
      step: number;
      action: string;
      file: string;
      content?: string;
      note?: string;
    }> = [];

    let step = 1;

    // Step 1: Instruction file
    setupSteps.push({
      step: step++,
      action: hasInstructionFile ? 'append' : 'create',
      file: instructions.file_path,
      content: instructions.content,
      note: hasInstructionFile
        ? `Append the content to your existing ${instructions.file_path}`
        : `Create ${instructions.file_path} with the content`,
    });

    // Step 2: MCP config
    const mcpContent = isOpenCode
      ? JSON.stringify({ mcp: mcpConfigEntry }, null, 2)
      : JSON.stringify({ mcpServers: mcpConfigEntry }, null, 2);
    const mcpMergeNote = isOpenCode
      ? `Merge the toolcairn entry into your existing ${mcpConfigFile} under "mcp"`
      : `Merge the toolcairn entry into your existing ${mcpConfigFile} under "mcpServers"`;
    const mcpCreateNote = isOpenCode
      ? `Create ${mcpConfigFile} with this content (OpenCode MCP config format)`
      : `Create ${mcpConfigFile} with this content`;
    setupSteps.push({
      step: step++,
      action: hasMcpJson ? 'merge' : 'create',
      file: mcpConfigFile,
      content: mcpContent,
      note: hasMcpJson ? mcpMergeNote : mcpCreateNote,
    });

    // Step 3: Project config
    if (!hasToolpilotConfig) {
      setupSteps.push({
        step: step++,
        action: 'create',
        file: '.toolcairn/config.json',
        note: 'Call init_project_config to generate the config content, then write to .toolcairn/config.json',
      });
    }

    // Step 4: Tracker dashboard
    if (!hasTrackerHtml) {
      setupSteps.push({
        step: step++,
        action: 'create',
        file: '.toolcairn/tracker.html',
        content: generateTrackerHtml(eventsPath),
        note: `Open .toolcairn/tracker.html in your browser to monitor MCP tool calls in real time. Set TOOLCAIRN_EVENTS_PATH=${eventsPath} in your MCP server environment to enable event logging.`,
      });
    }

    // Step 5: Gitignore
    setupSteps.push({
      step: step++,
      action: 'append',
      file: '.gitignore',
      content: '\n# ToolCairn\n.toolcairn/events.jsonl\n',
      note: 'Add .toolcairn/events.jsonl to .gitignore (the tracker event log)',
    });

    const agentFileLabel: Record<AgentType, string> = {
      claude: 'CLAUDE.md',
      cursor: '.cursorrules',
      windsurf: '.windsurfrules',
      copilot: '.github/copilot-instructions.md',
      'copilot-cli': '.github/copilot-instructions.md',
      opencode: 'AGENTS.md',
      generic: 'AI_INSTRUCTIONS.md',
    };

    return okResult({
      agent: args.agent,
      instruction_file: agentFileLabel[args.agent],
      setup_steps: setupSteps,
      mcp_config_entry: mcpConfigEntry,
      events_path: eventsPath,
      summary: [
        `ToolCairn setup for ${args.agent} agent in ${args.project_root}`,
        `Instructions will be added to: ${instructions.file_path}`,
        'MCP server entry: toolpilot → .mcp.json',
        hasToolpilotConfig
          ? '.toolcairn/config.json already exists — skipping init'
          : 'Run init_project_config next to generate .toolcairn/config.json',
        hasTrackerHtml
          ? '.toolcairn/tracker.html already exists — skipping'
          : `Tracker dashboard: open .toolcairn/tracker.html in browser (set TOOLCAIRN_EVENTS_PATH=${eventsPath})`,
      ].join('\n'),
      next_steps: hasToolpilotConfig
        ? 'Setup complete. Open .toolcairn/tracker.html to monitor tool calls.'
        : 'After completing setup steps, call init_project_config to initialize .toolcairn/config.json.',
    });
  } catch (e) {
    logger.error({ err: e }, 'toolcairn_init failed');
    return errResult('init_error', e instanceof Error ? e.message : String(e));
  }
}
