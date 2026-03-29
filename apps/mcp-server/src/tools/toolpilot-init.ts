import pino from 'pino';
import {
  type AgentType,
  getInstructionsForAgent,
  getMcpConfigEntry,
} from '../templates/agent-instructions.js';
import { errResult, okResult } from '../utils.js';
import { generateTrackerHtml } from './generate-tracker.js';

const logger = pino({ name: '@toolpilot/mcp-server:toolpilot-init' });

export async function handleToolpilotInit(args: {
  agent: AgentType;
  project_root: string;
  server_path?: string;
  detected_files?: string[];
}) {
  try {
    logger.info({ agent: args.agent, project_root: args.project_root }, 'toolpilot_init called');

    const instructions = getInstructionsForAgent(args.agent);
    const mcpConfigEntry = getMcpConfigEntry(args.server_path);

    // Determine if .mcp.json already seems to exist based on detected files
    const hasMcpJson = args.detected_files?.some(
      (f) => f === '.mcp.json' || f.endsWith('/.mcp.json'),
    );
    const hasInstructionFile = args.detected_files?.some((f) => f.endsWith(instructions.file_path));
    const hasToolpilotConfig = args.detected_files?.some((f) =>
      f.includes('.toolpilot/config.json'),
    );
    const hasTrackerHtml = args.detected_files?.some((f) => f.includes('.toolpilot/tracker.html'));

    // Default events path: <project_root>/.toolpilot/events.jsonl
    const eventsPath = `${args.project_root}/.toolpilot/events.jsonl`;

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
    setupSteps.push({
      step: step++,
      action: hasMcpJson ? 'merge' : 'create',
      file: '.mcp.json',
      content: JSON.stringify({ mcpServers: mcpConfigEntry }, null, 2),
      note: hasMcpJson
        ? 'Merge the toolpilot entry into your existing .mcp.json under "mcpServers"'
        : 'Create .mcp.json with this content',
    });

    // Step 3: Project config
    if (!hasToolpilotConfig) {
      setupSteps.push({
        step: step++,
        action: 'create',
        file: '.toolpilot/config.json',
        note: 'Call init_project_config to generate the config content, then write to .toolpilot/config.json',
      });
    }

    // Step 4: Tracker dashboard
    if (!hasTrackerHtml) {
      setupSteps.push({
        step: step++,
        action: 'create',
        file: '.toolpilot/tracker.html',
        content: generateTrackerHtml(eventsPath),
        note:
          'Open .toolpilot/tracker.html in your browser to monitor MCP tool calls in real time. Set TOOLPILOT_EVENTS_PATH=' +
          eventsPath +
          ' in your MCP server environment to enable event logging.',
      });
    }

    // Step 5: Gitignore
    setupSteps.push({
      step: step++,
      action: 'append',
      file: '.gitignore',
      content: '\n# ToolPilot\n.toolpilot/events.jsonl\n',
      note: 'Add .toolpilot/events.jsonl to .gitignore (the tracker event log)',
    });

    const agentFileLabel: Record<AgentType, string> = {
      claude: 'CLAUDE.md',
      cursor: '.cursorrules',
      windsurf: '.windsurfrules',
      copilot: '.github/copilot-instructions.md',
      generic: 'AI_INSTRUCTIONS.md',
    };

    return okResult({
      agent: args.agent,
      instruction_file: agentFileLabel[args.agent],
      setup_steps: setupSteps,
      mcp_config_entry: mcpConfigEntry,
      events_path: eventsPath,
      summary: [
        `ToolPilot setup for ${args.agent} agent in ${args.project_root}`,
        `Instructions will be added to: ${instructions.file_path}`,
        `MCP server entry: toolpilot → .mcp.json`,
        hasToolpilotConfig
          ? '.toolpilot/config.json already exists — skipping init'
          : 'Run init_project_config next to generate .toolpilot/config.json',
        hasTrackerHtml
          ? '.toolpilot/tracker.html already exists — skipping'
          : `Tracker dashboard: open .toolpilot/tracker.html in browser (set TOOLPILOT_EVENTS_PATH=${eventsPath})`,
      ].join('\n'),
      next_steps: hasToolpilotConfig
        ? 'Setup complete. Open .toolpilot/tracker.html to monitor tool calls.'
        : 'After completing setup steps, call init_project_config to initialize .toolpilot/config.json.',
    });
  } catch (e) {
    logger.error({ err: e }, 'toolpilot_init failed');
    return errResult('init_error', e instanceof Error ? e.message : String(e));
  }
}
