import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Data Flow – ToolPilot Docs',
  description:
    'Read path, write path, and feedback loop — how data moves through the ToolPilot platform.',
};

const READ_PATH_DIAGRAM = `Agent ──▶ MCP Server ──▶ Search Package
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   Stage 1: Retrieve   Stage 2: Filter   Stage 3: Rerank
   (Qdrant BM25 +      (Qdrant payload   (Memgraph Cypher
    dense vectors)       queries)          graph traversal)
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                       Stage 4: Select
                              │
                              ▼
                      MCP Response ──▶ Agent`;

const WRITE_PATH_DIAGRAM = `GitHub API ──▶ Indexer ──▶ Redis Streams ──▶ Workers
                                                         │
                              ┌───────────────────────────┤
                              ▼               ▼           ▼
                          Memgraph        Qdrant     PostgreSQL
                         (graph nodes    (vector     (session &
                          & edges)       embeddings)  analytics)`;

const FEEDBACK_DIAGRAM = `Agent ──▶ report_outcome ──▶ MCP Server
                                        │
                                        ▼
                              Graph Edge Update
                            (reinforce or attenuate
                              RELATED_TO weights)
                                        │
                                        ▼
                              Future searches return
                              improved recommendations`;

export default function DataFlowPage() {
  const { prev, next } = getPrevNext('/docs/architecture/data-flow');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'Data Flow' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Data Flow
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        ToolPilot has three primary data paths: a <strong>read path</strong> for
        query processing, a <strong>write path</strong> for data ingestion, and
        a <strong>feedback path</strong> that improves results over time.
      </p>

      {/* ─── Read Path ─── */}
      <h2
        id="read-path"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Read Path (Query Processing)
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Every tool discovery request follows this pipeline:
      </p>
      <CodeBlock code={READ_PATH_DIAGRAM} language="text" />

      <div className="mt-6 flex flex-col gap-1">
        {READ_STEPS.map((step) => (
          <StepRow key={step.number} step={step} />
        ))}
      </div>

      {/* ─── Write Path ─── */}
      <h2
        id="write-path"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Write Path (Data Ingestion)
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        The indexer continuously updates the tool corpus:
      </p>
      <CodeBlock code={WRITE_PATH_DIAGRAM} language="text" />

      <div className="mt-6 flex flex-col gap-1">
        {WRITE_STEPS.map((step) => (
          <StepRow key={step.number} step={step} />
        ))}
      </div>

      {/* ─── Feedback Path ─── */}
      <h2
        id="feedback-path"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Feedback Path
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Agent feedback creates a reinforcement loop that improves future
        recommendations:
      </p>
      <CodeBlock code={FEEDBACK_DIAGRAM} language="text" />

      <div className="mt-6 flex flex-col gap-1">
        {FEEDBACK_STEPS.map((step) => (
          <StepRow key={step.number} step={step} />
        ))}
      </div>

      <div className="mt-6">
        <Callout type="tip" title="Continuous improvement">
          The feedback path means ToolPilot gets smarter with every interaction.
          Positive outcomes reinforce graph edges, while negative outcomes
          attenuate them — no manual curation required.
        </Callout>
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Step data ─── */

interface StepInfo {
  number: number;
  title: string;
  detail: string;
}

const READ_STEPS: StepInfo[] = [
  {
    number: 1,
    title: 'Agent sends MCP tool call',
    detail:
      'The AI agent invokes search_tools (or another MCP tool) over the MCP protocol with a natural-language query and optional filters.',
  },
  {
    number: 2,
    title: 'MCP Server validates input',
    detail:
      'Zod schemas validate every incoming parameter. Malformed requests are rejected before they reach the search layer.',
  },
  {
    number: 3,
    title: 'Search package loads tool corpus',
    detail:
      'The search package receives the validated request and prepares the 4-stage pipeline against the Qdrant collection.',
  },
  {
    number: 4,
    title: 'Stage 1 — BM25 + Vector search',
    detail:
      'Qdrant performs hybrid retrieval: sparse BM25 keyword matching combined with dense 768-dimensional vector similarity (Nomic Embed Code).',
  },
  {
    number: 5,
    title: 'Stage 2 — Payload filtering',
    detail:
      'Qdrant payload queries narrow results by language, category, license, minimum health score, and other metadata constraints.',
  },
  {
    number: 6,
    title: 'Stage 3 — Graph reranking',
    detail:
      'Memgraph Cypher queries traverse RELATED_TO, DEPENDS_ON, and ALTERNATIVE_TO edges to boost contextually relevant tools and demote isolated ones.',
  },
  {
    number: 7,
    title: 'Stage 4 — Selection logic',
    detail:
      'Final scoring, deduplication, and diversity enforcement produce the ranked result set.',
  },
  {
    number: 8,
    title: 'Results returned via MCP protocol',
    detail:
      'The MCP Server formats the results (with health scores, descriptions, and related tools) and streams them back to the agent.',
  },
];

const WRITE_STEPS: StepInfo[] = [
  {
    number: 1,
    title: 'Indexer scans GitHub repositories',
    detail:
      'On a configurable schedule, the indexer queries the GitHub API for repositories matching tool-related topics and criteria.',
  },
  {
    number: 2,
    title: 'Extracts tool metadata',
    detail:
      'Stars, forks, open issues, last commit date, README content, license, topics, and language data are extracted for each repository.',
  },
  {
    number: 3,
    title: 'Queues update jobs via Redis Streams',
    detail:
      'Each discovered tool is published as a job to a Redis Stream. Consumer groups ensure exactly-once processing across worker replicas.',
  },
  {
    number: 4,
    title: 'Workers update Memgraph and Qdrant',
    detail:
      'Workers create or update Tool, Category, Language, and License nodes in Memgraph, and upsert vector embeddings in Qdrant.',
  },
  {
    number: 5,
    title: 'PostgreSQL stores session data',
    detail:
      'Indexing run metadata, health score history, and analytics events are persisted to PostgreSQL via Prisma for auditing and trend analysis.',
  },
];

const FEEDBACK_STEPS: StepInfo[] = [
  {
    number: 1,
    title: 'Agent calls report_outcome',
    detail:
      'After trying a recommended tool, the agent reports whether it was helpful, unhelpful, or partially useful via the report_outcome MCP tool.',
  },
  {
    number: 2,
    title: 'MCP Server processes outcome',
    detail:
      'The outcome is validated and matched to the original search session so the system knows which recommendations to adjust.',
  },
  {
    number: 3,
    title: 'Graph edge weights updated',
    detail:
      'Positive outcomes reinforce RELATED_TO edge weights (making the connection stronger). Negative outcomes attenuate weights, reducing future co-recommendations.',
  },
  {
    number: 4,
    title: 'Future searches use updated weights',
    detail:
      'Stage 3 (graph reranking) uses the updated edge weights, so the next agent to search gets improved results automatically.',
  },
];

/* ─── Step row component ─── */

function StepRow({ step }: { step: StepInfo }) {
  return (
    <div
      className="flex gap-4"
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{
          background: 'rgba(99,102,241,0.12)',
          color: 'var(--tp-accent)',
        }}
      >
        {step.number}
      </span>
      <div>
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--tp-text-primary)', margin: 0 }}
        >
          {step.title}
        </p>
        <p
          className="mt-1 text-sm leading-relaxed"
          style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
        >
          {step.detail}
        </p>
      </div>
    </div>
  );
}
