import type { ToolCategory } from '@toolpilot/core';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolpilot/mcp-server:refine-requirement' });

// Categories likely to include proprietary/non-OSS tools
const PROPRIETARY_PRONE_CATEGORIES: ToolCategory[] = ['monitoring', 'devops', 'auth'];

const CATEGORY_DESCRIPTIONS: Record<ToolCategory, string> = {
  'vector-database': 'vector store for embeddings and semantic search',
  'graph-database': 'graph database for relationship-heavy data',
  'relational-database': 'SQL database for structured data',
  'llm-framework': 'framework for working with large language models',
  'agent-framework': 'framework for building AI agents',
  'web-framework': 'HTTP server or web application framework',
  auth: 'authentication, authorization, or identity management',
  testing: 'testing framework or test runner',
  devops: 'CI/CD, infrastructure, or deployment tooling',
  'mcp-server': 'Model Context Protocol server',
  queue: 'message queue, event streaming, or job queue',
  cache: 'caching layer or in-memory data store',
  search: 'full-text or keyword search engine',
  embedding: 'embedding model or text vectorization service',
  monitoring: 'observability, logging, or metrics collection',
  other: 'general purpose tool or utility',
};

// Keywords that signal specific tool categories in a prompt
const CATEGORY_SIGNALS: Array<{ keywords: string[]; category: ToolCategory }> = [
  {
    keywords: ['vector', 'embedding', 'semantic search', 'similarity', 'rag', 'retrieval'],
    category: 'vector-database',
  },
  {
    keywords: ['graph', 'relationship', 'nodes', 'edges', 'knowledge graph', 'network'],
    category: 'graph-database',
  },
  {
    keywords: ['database', 'sql', 'postgres', 'mysql', 'sqlite', 'relational', 'orm', 'prisma'],
    category: 'relational-database',
  },
  {
    keywords: ['llm', 'language model', 'gpt', 'claude', 'openai', 'anthropic', 'ai', 'chatbot'],
    category: 'llm-framework',
  },
  {
    keywords: ['agent', 'tool use', 'autonomous', 'workflow', 'orchestrat'],
    category: 'agent-framework',
  },
  {
    keywords: [
      'web framework',
      'api server',
      'rest api',
      'http server',
      'backend',
      'frontend',
      'fullstack',
      'next',
      'react',
      'express',
      'hono',
      'fastapi',
    ],
    category: 'web-framework',
  },
  {
    keywords: [
      'auth',
      'login',
      'authentication',
      'authorization',
      'oauth',
      'jwt',
      'session',
      'user account',
    ],
    category: 'auth',
  },
  {
    keywords: ['test', 'unit test', 'integration test', 'e2e', 'playwright', 'vitest', 'jest'],
    category: 'testing',
  },
  {
    keywords: ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'container', 'cloud'],
    category: 'devops',
  },
  {
    keywords: ['queue', 'message', 'event stream', 'redis', 'kafka', 'rabbitmq', 'job'],
    category: 'queue',
  },
  {
    keywords: ['cache', 'caching', 'memcache', 'redis cache', 'in-memory'],
    category: 'cache',
  },
  {
    keywords: ['search', 'full-text', 'elasticsearch', 'typesense', 'meilisearch', 'algolia'],
    category: 'search',
  },
  {
    keywords: ['embed', 'vectorize', 'nomic', 'openai embed', 'sentence transformer'],
    category: 'embedding',
  },
  {
    keywords: [
      'monitor',
      'observ',
      'log',
      'metric',
      'trace',
      'alert',
      'dashboard',
      'datadog',
      'grafana',
    ],
    category: 'monitoring',
  },
];

function inferCategories(prompt: string): ToolCategory[] {
  const lower = prompt.toLowerCase();
  const found = new Set<ToolCategory>();
  for (const { keywords, category } of CATEGORY_SIGNALS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.add(category);
    }
  }
  return Array.from(found);
}

export async function handleRefineRequirement(args: {
  prompt: string;
  classification: 'tool_discovery' | 'stack_building' | 'tool_comparison' | 'tool_configuration';
  project_context?: {
    existing_tools?: string[];
    language?: string;
    framework?: string;
  };
}) {
  try {
    logger.info({ classification: args.classification }, 'refine_requirement called');

    const inferredCategories = inferCategories(args.prompt);
    const existingTools = args.project_context?.existing_tools ?? [];
    const language = args.project_context?.language ?? 'any';
    const framework = args.project_context?.framework;

    const projectContext =
      existingTools.length > 0
        ? `\nProject already uses: ${existingTools.join(', ')}. Do NOT suggest these as new requirements.`
        : '';

    const languageContext = language !== 'any' ? `\nTarget language/runtime: ${language}.` : '';
    const frameworkContext = framework ? `\nExisting framework: ${framework}.` : '';

    // Build the decomposition prompt the agent uses to extract structured requirements
    const decomposition_prompt = `You are a software architect. Analyze this developer request and decompose it into specific, independent tool requirements.

Developer request:
"""
${args.prompt}
"""
${projectContext}${languageContext}${frameworkContext}

For each distinct tool/service/library category needed, output a JSON object with:
- "need": short description of what is needed (e.g., "authentication system", "full-text search")
- "category": one of [${Object.keys(CATEGORY_DESCRIPTIONS).join(', ')}]
- "constraints": object with optional keys: language, deployment_model (self-hosted/cloud/embedded/serverless), license (open-source/commercial)
- "search_query": a focused search query string to find the right tool (5-15 words)
- "why": one sentence explaining why this component is needed
- "is_likely_proprietary": true if this component often uses paid/closed-source services

Output a valid JSON array of these objects. Output ONLY the JSON array, no explanation.

Hints for decomposition:
${inferredCategories.map((c) => `- Detected signal for category: "${c}" (${CATEGORY_DESCRIPTIONS[c]})`).join('\n') || '- No strong category signals detected; use context to infer needs'}`;

    // Pre-compute requirements from inferred categories as a helpful starting point
    const inferred_requirements = inferredCategories.map((category) => ({
      need: CATEGORY_DESCRIPTIONS[category],
      category,
      search_query: `${category} ${language !== 'any' ? language : ''} ${framework ?? ''}`.trim(),
      is_likely_proprietary: PROPRIETARY_PRONE_CATEGORIES.includes(category),
    }));

    const agent_instructions = [
      '1. Send decomposition_prompt to the LLM and parse the JSON array response.',
      '2. For each requirement where is_likely_proprietary is false, call search_tools with the search_query.',
      '3. For each requirement where is_likely_proprietary is true, note that these may not be in the ToolPilot index.',
      '4. After all searches complete, call get_stack if classification is "stack_building" for a bundled recommendation.',
      '5. Update .toolpilot/config.json with confirmed tools using update_project_config.',
    ].join('\n');

    return okResult({
      decomposition_prompt,
      inferred_categories: inferredCategories,
      inferred_requirements,
      agent_instructions,
      classification: args.classification,
      next_tool: args.classification === 'stack_building' ? 'get_stack' : 'search_tools',
    });
  } catch (e) {
    logger.error({ err: e }, 'refine_requirement failed');
    return errResult('refine_error', e instanceof Error ? e.message : String(e));
  }
}
