import { TerminalIcon } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const MCP_CONFIG = `{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}`;

const TOOLS = [
  { name: 'search_tools', desc: 'Natural-language tool search with guided discovery' },
  { name: 'get_stack', desc: 'Full stack recommendation for a project description' },
  { name: 'compare_tools', desc: 'Head-to-head comparison with health metrics' },
  { name: 'check_compatibility', desc: 'Check if two tools are known to work together' },
  { name: 'check_issue', desc: 'Look up known bugs and issues for a tool' },
  { name: 'report_outcome', desc: 'Feed results back to improve recommendations' },
] as const;

const AGENTS = ['Claude', 'Cursor', 'VS Code', 'Windsurf'] as const;

export function McpSection() {
  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Left: text */}
          <ScrollReveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              MCP Integration
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for AI agents
            </h2>
            <p className="mb-8 text-slate-500">
              Add ToolCairn to any MCP-compatible agent with a single config block. Your agent
              immediately gains access to graph-powered tool intelligence.
            </p>

            {/* Compatible agents */}
            <div className="mb-8 flex flex-wrap gap-2">
              {AGENTS.map((agent) => (
                <span
                  key={agent}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {agent}
                </span>
              ))}
            </div>

            {/* Tool list */}
            <ul className="space-y-3">
              {TOOLS.map(({ name, desc }) => (
                <li key={name} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 whitespace-nowrap">
                    {name}
                  </span>
                  <span className="text-sm text-slate-500">{desc}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Right: code block */}
          <ScrollReveal delay={100}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
              {/* Terminal chrome */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-900 px-4 py-3">
                <TerminalIcon className="size-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">claude_desktop_config.json</span>
              </div>
              <pre className="bg-slate-950 p-6 text-sm leading-relaxed text-slate-300 overflow-x-auto">
                <code>{MCP_CONFIG}</code>
              </pre>
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  One config. All 14 tools. No individual authentication required.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
