import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { ParamTable } from '@/components/docs/param-table';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Graph Schema – ToolPilot Docs',
  description:
    'Complete reference for all node types, edge types, and properties in the ToolPilot Memgraph tool graph.',
};

/* ─── Node property definitions ─── */

const TOOL_PROPS = [
  { name: 'name', type: 'string', required: true, description: 'Short unique name (e.g. "prisma")' },
  { name: 'full_name', type: 'string', required: true, description: 'GitHub owner/repo (e.g. "prisma/prisma")' },
  { name: 'description', type: 'string', required: true, description: 'One-line tool description from the repository' },
  { name: 'url', type: 'string', required: true, description: 'GitHub repository URL' },
  { name: 'language', type: 'string', required: false, description: 'Primary programming language' },
  { name: 'category', type: 'string', required: false, description: 'Primary category slug' },
  { name: 'stars', type: 'number', required: true, description: 'GitHub star count' },
  { name: 'forks', type: 'number', required: true, description: 'GitHub fork count' },
  { name: 'open_issues', type: 'number', required: true, description: 'Current open issue count' },
  { name: 'license', type: 'string', required: false, description: 'SPDX license identifier' },
  { name: 'health_score', type: 'number', required: true, description: 'Computed health score (0–100)', default: '0' },
  { name: 'maintenance_score', type: 'number', required: true, description: 'Maintenance sub-score (0–100)', default: '0' },
  { name: 'last_commit', type: 'string', required: true, description: 'ISO 8601 timestamp of most recent commit' },
  { name: 'created_at', type: 'string', required: true, description: 'ISO 8601 repository creation date' },
  { name: 'docs_url', type: 'string', required: false, description: 'External documentation URL' },
  { name: 'homepage', type: 'string', required: false, description: 'Project homepage URL' },
  { name: 'topics', type: 'string[]', required: false, description: 'GitHub topics array', default: '[]' },
];

const CATEGORY_PROPS = [
  { name: 'name', type: 'string', required: true, description: 'Category slug (e.g. "orm", "testing")' },
  { name: 'description', type: 'string', required: false, description: 'Human-readable category description' },
  { name: 'tool_count', type: 'number', required: true, description: 'Number of tools in this category', default: '0' },
];

const LANGUAGE_PROPS = [
  { name: 'name', type: 'string', required: true, description: 'Language name (e.g. "TypeScript")' },
  { name: 'color', type: 'string', required: false, description: 'Hex color for UI display (e.g. "#3178c6")' },
];

const LICENSE_PROPS = [
  { name: 'key', type: 'string', required: true, description: 'Lowercase key (e.g. "mit", "apache-2.0")' },
  { name: 'name', type: 'string', required: true, description: 'Human-readable name (e.g. "MIT License")' },
  { name: 'spdx_id', type: 'string', required: true, description: 'SPDX identifier (e.g. "MIT")' },
];

/* ─── Edge definitions ─── */

interface EdgeDef {
  type: string;
  from: string;
  to: string;
  description: string;
  properties: Array<{ name: string; type: string; required: boolean; description: string; default?: string }>;
}

const EDGES: EdgeDef[] = [
  {
    type: 'RELATED_TO',
    from: 'Tool',
    to: 'Tool',
    description:
      'Indicates two tools are related — through co-usage patterns, shared ecosystem, or integration capabilities. Weight is reinforced/attenuated by agent feedback.',
    properties: [
      { name: 'weight', type: 'number', required: true, description: 'Relationship strength (0.0–1.0)', default: '0.5' },
      { name: 'type', type: 'string', required: true, description: 'Relationship kind: "co-usage" | "ecosystem" | "integration"' },
      { name: 'created_at', type: 'string', required: true, description: 'ISO 8601 edge creation timestamp' },
      { name: 'last_reinforced', type: 'string', required: false, description: 'ISO 8601 timestamp of last feedback reinforcement' },
    ],
  },
  {
    type: 'BELONGS_TO',
    from: 'Tool',
    to: 'Category',
    description: 'Assigns a tool to a category. A tool may belong to multiple categories.',
    properties: [],
  },
  {
    type: 'WRITTEN_IN',
    from: 'Tool',
    to: 'Language',
    description: 'Links a tool to a programming language it is written in.',
    properties: [
      { name: 'is_primary', type: 'boolean', required: true, description: 'Whether this is the primary language', default: 'false' },
    ],
  },
  {
    type: 'LICENSED_AS',
    from: 'Tool',
    to: 'License',
    description: 'Associates a tool with its open-source license.',
    properties: [],
  },
  {
    type: 'ALTERNATIVE_TO',
    from: 'Tool',
    to: 'Tool',
    description: 'Marks two tools as alternatives that solve the same problem.',
    properties: [
      { name: 'weight', type: 'number', required: true, description: 'Relationship strength (0.0–1.0)', default: '0.5' },
      { name: 'similarity_score', type: 'number', required: true, description: 'Computed feature similarity (0.0–1.0)' },
    ],
  },
  {
    type: 'DEPENDS_ON',
    from: 'Tool',
    to: 'Tool',
    description: 'Indicates a runtime or build-time dependency between tools.',
    properties: [
      { name: 'version_constraint', type: 'string', required: false, description: 'Semver range (e.g. "^5.0.0")' },
      { name: 'is_dev_dependency', type: 'boolean', required: true, description: 'Whether this is a dev-only dependency', default: 'false' },
    ],
  },
];

/* ─── Example Cypher queries ─── */

const CYPHER_RELATED = `// Find tools related to Prisma, ordered by relationship strength
MATCH (t:Tool {name: 'prisma'})-[r:RELATED_TO]->(related:Tool)
RETURN related.name, r.weight
ORDER BY r.weight DESC
LIMIT 10`;

const CYPHER_CATEGORY = `// List all tools in the "orm" category
MATCH (t:Tool)-[:BELONGS_TO]->(c:Category {name: 'orm'})
RETURN t.name, t.stars, t.health_score
ORDER BY t.health_score DESC`;

const CYPHER_ALTERNATIVES = `// Find alternatives to Express
MATCH (t:Tool {name: 'express'})-[r:ALTERNATIVE_TO]->(alt:Tool)
RETURN alt.name, r.similarity_score
ORDER BY r.similarity_score DESC`;

const CYPHER_DEPENDENCIES = `// Trace the dependency tree of a tool
MATCH path = (t:Tool {name: 'next'})-[:DEPENDS_ON*1..3]->(dep:Tool)
RETURN [n IN nodes(path) | n.name] AS chain`;

export default function GraphSchemaPage() {
  const { prev, next } = getPrevNext('/docs/reference/graph-schema');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Reference', href: '/docs/reference' },
          { label: 'Graph Schema' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Graph Schema
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Complete reference for the Memgraph tool graph — every node type, edge
        type, and their properties.
      </p>

      {/* ─── Node Types ─── */}
      <h2
        id="node-types"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Node Types
      </h2>

      {/* Tool */}
      <h3
        id="tool-node"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Tool
      </h3>
      <p
        className="mt-1 mb-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Represents a developer tool, library, or framework indexed from GitHub.
      </p>
      <ParamTable params={TOOL_PROPS} />

      {/* Category */}
      <h3
        id="category-node"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Category
      </h3>
      <p
        className="mt-1 mb-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        A taxonomy grouping for related tools (e.g. &ldquo;orm&rdquo;,
        &ldquo;testing&rdquo;, &ldquo;bundler&rdquo;).
      </p>
      <ParamTable params={CATEGORY_PROPS} />

      {/* Language */}
      <h3
        id="language-node"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Language
      </h3>
      <p
        className="mt-1 mb-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        A programming language that tools are written in.
      </p>
      <ParamTable params={LANGUAGE_PROPS} />

      {/* License */}
      <h3
        id="license-node"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        License
      </h3>
      <p
        className="mt-1 mb-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        An open-source license type.
      </p>
      <ParamTable params={LICENSE_PROPS} />

      {/* ─── Edge Types ─── */}
      <h2
        id="edge-types"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Edge Types
      </h2>

      {EDGES.map((edge) => (
        <div key={edge.type}>
          <h3
            id={`edge-${edge.type.toLowerCase().replace(/_/g, '-')}`}
            className="mt-8 text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {edge.type}
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <code style={{ color: 'var(--color-accent)' }}>
              (:{edge.from})
            </code>{' '}
            →{' '}
            <code style={{ color: 'var(--color-accent)' }}>
              (:{edge.to})
            </code>
          </p>
          <p
            className="mt-1 mb-4 text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {edge.description}
          </p>
          {edge.properties.length > 0 && (
            <ParamTable params={edge.properties} />
          )}
        </div>
      ))}

      {/* ─── Example Queries ─── */}
      <h2
        id="example-queries"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Example Cypher Queries
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Common patterns for querying the tool graph:
      </p>

      <h3
        id="query-related"
        className="mt-6 text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Find related tools
      </h3>
      <div className="mt-2">
        <CodeBlock code={CYPHER_RELATED} language="cypher" />
      </div>

      <h3
        id="query-category"
        className="mt-6 text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        List tools by category
      </h3>
      <div className="mt-2">
        <CodeBlock code={CYPHER_CATEGORY} language="cypher" />
      </div>

      <h3
        id="query-alternatives"
        className="mt-6 text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Find alternatives
      </h3>
      <div className="mt-2">
        <CodeBlock code={CYPHER_ALTERNATIVES} language="cypher" />
      </div>

      <h3
        id="query-dependencies"
        className="mt-6 text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Trace dependency tree
      </h3>
      <div className="mt-2">
        <CodeBlock code={CYPHER_DEPENDENCIES} language="cypher" />
      </div>

      <div className="mt-6">
        <Callout type="note" title="Memgraph compatibility">
          All queries use standard openCypher syntax supported by Memgraph. The
          graph package wraps these in parameterised queries via the Bolt
          protocol (neo4j-driver).
        </Callout>
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
