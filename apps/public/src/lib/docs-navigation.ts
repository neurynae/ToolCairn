export type DocPage = {
  title: string;
  href: string;
  description?: string;
  icon?: string;
};

export type DocSection = {
  title: string;
  href: string;
  icon: string;
  pages: DocPage[];
};

export const docsNavigation: DocSection[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: '🚀',
    pages: [
      {
        title: 'What is ToolPilot?',
        href: '/docs/getting-started',
        description: 'Overview of the platform',
      },
    ],
  },
  {
    title: 'Quick Start',
    href: '/docs/quickstart',
    icon: '⚡',
    pages: [
      { title: 'Quick Start Overview', href: '/docs/quickstart' },
      {
        title: 'Claude Code / Desktop',
        href: '/docs/quickstart/claude',
        description: 'Set up with Claude',
      },
      { title: 'Cursor', href: '/docs/quickstart/cursor', description: 'Set up with Cursor' },
      { title: 'Windsurf', href: '/docs/quickstart/windsurf', description: 'Set up with Windsurf' },
      {
        title: 'Custom Agent / SDK',
        href: '/docs/quickstart/custom',
        description: 'Integrate with any MCP client',
      },
      {
        title: 'Web Interface',
        href: '/docs/quickstart/web',
        description: 'Use the web search UI',
      },
    ],
  },
  {
    title: 'Core Concepts',
    href: '/docs/concepts',
    icon: '💡',
    pages: [
      { title: 'Concepts Overview', href: '/docs/concepts' },
      {
        title: 'Tool Graph Mesh',
        href: '/docs/concepts/graph-mesh',
        description: 'Nodes, edges, and properties',
      },
      {
        title: 'Search Pipeline',
        href: '/docs/concepts/search-pipeline',
        description: '4-stage discovery engine',
      },
      {
        title: 'Health Tiers',
        href: '/docs/concepts/health-tiers',
        description: 'Maintenance scoring',
      },
      {
        title: 'Guided Discovery',
        href: '/docs/concepts/guided-discovery',
        description: 'Clarification engine',
      },
      {
        title: 'Edge Decay',
        href: '/docs/concepts/edge-decay',
        description: 'Temporal weight formula',
      },
      {
        title: 'Feedback Loop',
        href: '/docs/concepts/feedback-loop',
        description: 'report_outcome → graph',
      },
    ],
  },
  {
    title: 'MCP Tools',
    href: '/docs/mcp-tools',
    icon: '🔧',
    pages: [
      { title: 'Tools Overview', href: '/docs/mcp-tools' },
      {
        title: 'search_tools',
        href: '/docs/mcp-tools/search-tools',
        description: 'Find the right tool',
      },
      {
        title: 'search_tools_respond',
        href: '/docs/mcp-tools/search-tools-respond',
        description: 'Answer clarification',
      },
      { title: 'get_stack', href: '/docs/mcp-tools/get-stack', description: 'Build a tool stack' },
      { title: 'check_issue', href: '/docs/mcp-tools/check-issue', description: 'Diagnose issues' },
      {
        title: 'report_outcome',
        href: '/docs/mcp-tools/report-outcome',
        description: 'Report feedback',
      },
    ],
  },
  {
    title: 'Guides',
    href: '/docs/guides',
    icon: '📖',
    pages: [
      { title: 'Guides Overview', href: '/docs/guides' },
      {
        title: 'Search Walkthrough',
        href: '/docs/guides/search-walkthrough',
        description: 'Complete search flow',
      },
      {
        title: 'Issue Diagnosis',
        href: '/docs/guides/issue-diagnosis',
        description: 'Debug with check_issue',
      },
      {
        title: 'Stack Building',
        href: '/docs/guides/stack-building',
        description: 'Build a compatible stack',
      },
      {
        title: 'Rich Context',
        href: '/docs/guides/rich-context',
        description: 'Skip clarification stages',
      },
    ],
  },
  {
    title: 'Architecture',
    href: '/docs/architecture',
    icon: '🏗️',
    pages: [
      { title: 'Architecture Overview', href: '/docs/architecture' },
      {
        title: 'System Overview',
        href: '/docs/architecture/overview',
        description: 'Component diagram',
      },
      { title: 'Data Flow', href: '/docs/architecture/data-flow', description: 'Read/write paths' },
      {
        title: 'Contributing',
        href: '/docs/architecture/contributing',
        description: 'Dev setup & conventions',
      },
    ],
  },
  {
    title: 'Reference',
    href: '/docs/reference',
    icon: '📚',
    pages: [
      { title: 'Reference Overview', href: '/docs/reference' },
      {
        title: 'Graph Schema',
        href: '/docs/reference/graph-schema',
        description: 'Node & edge types',
      },
      {
        title: 'Health Formula',
        href: '/docs/reference/health-formula',
        description: 'Scoring breakdown',
      },
    ],
  },
];

/** Flat list of all doc pages for search and prev/next navigation */
export const allDocPages: DocPage[] = docsNavigation.flatMap((section) => section.pages);

/** Find the previous and next pages relative to a given href */
export function getPrevNext(href: string): { prev: DocPage | null; next: DocPage | null } {
  const idx = allDocPages.findIndex((p) => p.href === href);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? (allDocPages[idx - 1] ?? null) : null,
    next: idx < allDocPages.length - 1 ? (allDocPages[idx + 1] ?? null) : null,
  };
}

/** Build search index entries from navigation */
export type SearchEntry = { title: string; href: string; section: string; description: string };

export function buildSearchIndex(): SearchEntry[] {
  return docsNavigation.flatMap((section) =>
    section.pages.map((page) => ({
      title: page.title,
      href: page.href,
      section: section.title,
      description: page.description ?? '',
    })),
  );
}
