import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tool Graph Mesh – ToolPilot Docs',
  description:
    "Deep dive into ToolPilot's Memgraph-powered property graph — nodes, edges, properties, and why a graph beats a keyword database.",
};

const CURRENT_HREF = '/docs/concepts/graph-mesh';

const graphDiagram = `┌─────────────┐    RELATED_TO     ┌─────────────┐
│   Prisma     │──── (w: 0.82) ───▶│  Drizzle    │
│  ★ 41.2k     │                    │  ★ 26.8k    │
│  health: 92  │                    │  health: 88 │
└──────┬───────┘                    └──────┬──────┘
       │                                   │
  WRITTEN_IN                          WRITTEN_IN
       │                                   │
       ▼                                   ▼
┌─────────────┐                    ┌──────────────┐
│ TypeScript  │                    │  TypeScript   │
└─────────────┘                    └──────────────┘
       │
  BELONGS_TO
       │
       ▼
┌─────────────┐    ALTERNATIVE_TO  ┌──────────────┐
│     ORM     │                    │   Knex.js    │
└─────────────┘                    └──────────────┘`;

const cypherExample = `// Find tools related to "prisma" with relationship strength
MATCH (t:Tool {name: "prisma"})-[r:RELATED_TO]->(related:Tool)
WHERE r.weight > 0.5
RETURN related.name, related.health_score, r.weight
ORDER BY r.weight DESC
LIMIT 10`;

export default function GraphMeshPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Tool Graph Mesh' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tool Graph Mesh
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            At the heart of ToolPilot is a Memgraph-powered property graph containing 491+ developer
            tools and thousands of relationships. Unlike a flat database, the graph captures how
            tools relate to each other — compatibility, alternatives, ecosystems, and more.
          </p>
        </section>

        {/* ─── Why a Graph? ─── */}
        <section>
          <h2
            id="why-a-graph"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Why a Graph?
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Developer tools don&rsquo;t exist in isolation. A testing framework depends on a
            language runtime, pairs naturally with a build tool, and competes with alternatives.
            Relational databases struggle to express these multi-hop, many-to-many relationships
            efficiently. A property graph makes traversals like &ldquo;find tools that work well
            with Prisma and are written in TypeScript&rdquo; a single Cypher query instead of a
            cascade of JOINs.
          </p>

          <Callout type="note" title="Graph vs. Keyword Search">
            Unlike keyword databases, the graph captures relationships that help agents understand
            which tools work well together — not just which ones match a search term.
          </Callout>
        </section>

        {/* ─── Node Types ─── */}
        <section>
          <h2
            id="node-types"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Node Types
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The graph contains five node types, each serving a distinct role in the tool ecosystem:
          </p>

          <div className="mt-4 space-y-4">
            {/* Tool */}
            <div
              className="rounded-lg p-4"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                id="node-tool"
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                🔧 Tool{' '}
                <span
                  className="ml-2 text-xs font-normal"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Primary node
                </span>
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
              >
                Represents a developer tool, library, or framework. This is the central entity in
                the graph — every other node type connects back to Tool nodes.
              </p>
              <div className="mt-3">
                <span
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Properties
                </span>
                <div
                  className="grid gap-1 text-xs"
                  style={{
                    gridTemplateColumns: 'auto 1fr',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <code style={{ color: 'var(--color-accent)' }}>name</code>
                  <span>Short identifier (e.g., &ldquo;prisma&rdquo;)</span>
                  <code style={{ color: 'var(--color-accent)' }}>full_name</code>
                  <span>GitHub-style owner/repo (e.g., &ldquo;prisma/prisma&rdquo;)</span>
                  <code style={{ color: 'var(--color-accent)' }}>description</code>
                  <span>One-line summary of what the tool does</span>
                  <code style={{ color: 'var(--color-accent)' }}>language</code>
                  <span>Primary programming language</span>
                  <code style={{ color: 'var(--color-accent)' }}>category</code>
                  <span>Functional category (e.g., &ldquo;ORM&rdquo;, &ldquo;Testing&rdquo;)</span>
                  <code style={{ color: 'var(--color-accent)' }}>stars</code>
                  <span>GitHub star count</span>
                  <code style={{ color: 'var(--color-accent)' }}>health_score</code>
                  <span>Maintenance score (0–100)</span>
                  <code style={{ color: 'var(--color-accent)' }}>maintenance_score</code>
                  <span>Detailed maintenance metric</span>
                  <code style={{ color: 'var(--color-accent)' }}>created_at</code>
                  <span>When the tool was first indexed</span>
                  <code style={{ color: 'var(--color-accent)' }}>updated_at</code>
                  <span>Last data refresh timestamp</span>
                  <code style={{ color: 'var(--color-accent)' }}>docs_url</code>
                  <span>Link to official documentation</span>
                </div>
              </div>
            </div>

            {/* Other node types */}
            {[
              {
                icon: '📂',
                name: 'Category',
                desc: 'Functional grouping like ORM, Testing Framework, CSS Framework, or Build Tool.',
                props: 'name, slug, tool_count',
              },
              {
                icon: '💬',
                name: 'Language',
                desc: 'Programming language or runtime. Tools connect here via WRITTEN_IN edges.',
                props: 'name, slug',
              },
              {
                icon: '📜',
                name: 'License',
                desc: 'Software license type (MIT, Apache-2.0, GPL-3.0, etc.).',
                props: 'name, spdx_id',
              },
              {
                icon: '💻',
                name: 'Platform',
                desc: 'Target platform or runtime environment (Node.js, Browser, Docker, etc.).',
                props: 'name, slug',
              },
            ].map((node) => (
              <div
                key={node.name}
                className="rounded-lg p-4"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <h3
                  id={`node-${node.name.toLowerCase()}`}
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {node.icon} {node.name}
                </h3>
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
                >
                  {node.desc}
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <strong>Properties:</strong> {node.props}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Edge Types ─── */}
        <section>
          <h2
            id="edge-types"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Edge Types
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Edges encode the relationships between nodes. Each edge type carries semantic meaning,
            and most have properties like{' '}
            <code style={{ color: 'var(--color-accent)' }}>weight</code> that influence search
            ranking.
          </p>

          <div
            className="mt-4 overflow-x-auto rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border-default)',
                  }}
                >
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Edge
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Direction
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Meaning
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Properties
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-secondary)' }}>
                {[
                  {
                    edge: 'RELATED_TO',
                    direction: 'Tool → Tool',
                    meaning: 'Tools that work well together, weighted by co-usage frequency',
                    props: 'weight (0–1), type, created_at, last_reinforced',
                  },
                  {
                    edge: 'BELONGS_TO',
                    direction: 'Tool → Category',
                    meaning: 'Functional category membership',
                    props: 'weight (0–1), created_at',
                  },
                  {
                    edge: 'WRITTEN_IN',
                    direction: 'Tool → Language',
                    meaning: 'Primary programming language of the tool',
                    props: 'created_at',
                  },
                  {
                    edge: 'LICENSED_AS',
                    direction: 'Tool → License',
                    meaning: 'Software license the tool is distributed under',
                    props: 'created_at',
                  },
                  {
                    edge: 'ALTERNATIVE_TO',
                    direction: 'Tool → Tool',
                    meaning: 'Competing or substitute tools that solve the same problem',
                    props: 'weight (0–1), created_at, last_reinforced',
                  },
                  {
                    edge: 'DEPENDS_ON',
                    direction: 'Tool → Tool',
                    meaning: 'Runtime or build-time dependency relationship',
                    props: 'weight (0–1), type, created_at',
                  },
                ].map((row) => (
                  <tr
                    key={row.edge}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  >
                    <td className="px-4 py-3">
                      <code style={{ color: 'var(--color-accent)' }}>{row.edge}</code>
                    </td>
                    <td className="px-4 py-3" style={{ whiteSpace: 'nowrap' }}>
                      {row.direction}
                    </td>
                    <td className="px-4 py-3">{row.meaning}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {row.props}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Graph Visualization ─── */}
        <section>
          <h2
            id="graph-visualization"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Graph Visualization
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Here&rsquo;s a simplified view of how tool nodes connect through different edge types in
            the graph:
          </p>
          <CodeBlock code={graphDiagram} filename="Example: ORM tool relationships" />
        </section>

        {/* ─── Querying the Graph ─── */}
        <section>
          <h2
            id="querying-the-graph"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Querying the Graph
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Under the hood, ToolPilot uses Cypher queries (via the Bolt protocol) to traverse the
            graph. The search pipeline builds these queries automatically, but here&rsquo;s what a
            typical relationship traversal looks like:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={cypherExample}
              language="cypher"
              filename="Cypher query example"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Edge Properties ─── */}
        <section>
          <h2
            id="edge-properties"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Edge Properties
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The most important edge property is{' '}
            <code style={{ color: 'var(--color-accent)' }}>weight</code>, a float between 0 and 1
            that represents relationship strength. Weights are influenced by:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              <strong>Co-usage frequency</strong> — how often tools appear together in real projects
            </li>
            <li>
              <strong>GitHub co-occurrence</strong> — package.json, requirements.txt, and similar
              manifest analysis
            </li>
            <li>
              <strong>Agent feedback</strong> — success/failure reports from{' '}
              <code style={{ color: 'var(--color-accent)' }}>report_outcome</code>
            </li>
            <li>
              <strong>Temporal decay</strong> — weights decrease over time without reinforcement
              (see Edge Decay)
            </li>
          </ul>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Other properties include{' '}
            <code style={{ color: 'var(--color-accent)' }}>created_at</code> (when the edge was
            first established) and{' '}
            <code style={{ color: 'var(--color-accent)' }}>last_reinforced</code> (when the weight
            was last boosted by new evidence).
          </p>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
