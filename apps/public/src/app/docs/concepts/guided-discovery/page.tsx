import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guided Discovery – ToolPilot Docs',
  description:
    "How ToolPilot's clarification engine asks the right questions to narrow ambiguous queries before returning results.",
};

const CURRENT_HREF = '/docs/concepts/guided-discovery';

const flowDiagram = `  Agent                          ToolPilot MCP Server
    │                                    │
    │  search_tools("vector database")   │
    │ ──────────────────────────────────▶ │
    │                                    │
    │                          ┌─────────┴─────────┐
    │                          │ Stage 1: Retrieval │
    │                          │ 12 candidates span │
    │                          │ 3 deployment types │
    │                          │ Confidence < 0.7   │
    │                          └─────────┬─────────┘
    │                                    │
    │  ◀──── clarification response ──── │
    │  "What deployment model?"          │
    │  options: [embedded, hosted,       │
    │            specialized]            │
    │                                    │
    │  search_tools_respond("embedded")  │
    │ ──────────────────────────────────▶ │
    │                                    │
    │                          ┌─────────┴─────────┐
    │                          │ Stage 2–4: Filter, │
    │                          │ Rerank, Select     │
    │                          └─────────┬─────────┘
    │                                    │
    │  ◀──── final recommendation ────── │
    │  "ChromaDB" (score: 0.91)          │
    │                                    │`;

const richContextExample = `// Skip clarification by providing context upfront
search_tools({
  query: "vector database",
  context: {
    language: "python",
    deployment: "embedded",
    use_case: "RAG pipeline for LLM app"
  }
})

// → Goes straight to Stage 2–4 with filters pre-applied
// → Returns final recommendation immediately`;

const clarificationResponse = `// Clarification response structure
{
  "type": "clarification",
  "session_id": "sess_abc123",
  "questions": [
    {
      "id": "deployment",
      "text": "What deployment model do you need?",
      "options": [
        { "value": "embedded", "label": "Embedded (in-process)" },
        { "value": "hosted",   "label": "Hosted / managed service" },
        { "value": "self-hosted", "label": "Self-hosted server" }
      ]
    },
    {
      "id": "language",
      "text": "What language is your project in?",
      "options": [
        { "value": "python",     "label": "Python" },
        { "value": "typescript", "label": "TypeScript" },
        { "value": "go",         "label": "Go" }
      ]
    }
  ]
}`;

export default function GuidedDiscoveryPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Guided Discovery' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Guided Discovery
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Not every query has a single right answer. When a search is ambiguous, ToolPilot&rsquo;s
            clarification engine asks targeted questions to understand what you actually need before
            committing to a recommendation.
          </p>
        </section>

        {/* ─── The Problem ─── */}
        <section>
          <h2
            id="the-problem"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Problem
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Consider the query &ldquo;vector database&rdquo;. This could mean an embedded library
            like ChromaDB, a hosted service like Pinecone, or a specialized engine like Milvus.
            Returning a single tool would be a guess. Returning all 12 candidates would be noise.
            ToolPilot needs a middle path.
          </p>
        </section>

        {/* ─── How It Works ─── */}
        <section>
          <h2
            id="how-it-works"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            How It Works
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            After Stage 1 retrieval, ToolPilot analyzes the candidate distribution. If the
            confidence score is below the threshold (typically 0.7), it generates clarification
            questions based on where candidates diverge:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              Candidates span <strong>3 languages</strong> → ask which language
            </li>
            <li>
              Candidates span <strong>multiple categories</strong> → ask which category
            </li>
            <li>
              Candidates have <strong>different deployment models</strong> → ask about deployment
            </li>
            <li>
              Candidates have <strong>mixed licenses</strong> → ask about license requirements
            </li>
          </ul>
        </section>

        {/* ─── The Flow ─── */}
        <section>
          <h2
            id="the-flow"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Flow
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Here&rsquo;s the complete interaction flow between an agent and the ToolPilot MCP server
            during a guided discovery session:
          </p>
          <div className="mt-4">
            <CodeBlock code={flowDiagram} filename="Guided discovery sequence" />
          </div>
        </section>

        {/* ─── Question Types ─── */}
        <section>
          <h2
            id="question-types"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Question Types
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Clarification questions are generated dynamically based on candidate variance. The four
            question types are:
          </p>

          <div className="mt-4 space-y-3">
            {[
              {
                type: 'Language',
                icon: '💬',
                example: '"What language is your project in?"',
                trigger: 'Candidates written in 2+ different languages',
              },
              {
                type: 'Category',
                icon: '📂',
                example: '"What type of tool are you looking for?"',
                trigger: 'Candidates span multiple functional categories',
              },
              {
                type: 'License',
                icon: '📜',
                example: '"Do you need a specific license type?"',
                trigger: 'Mix of permissive and copyleft licenses in candidates',
              },
              {
                type: 'Deployment',
                icon: '🚀',
                example: '"What deployment model do you need?"',
                trigger: 'Candidates include embedded, hosted, and self-hosted options',
              },
            ].map((q) => (
              <div
                key={q.type}
                className="flex gap-3 rounded-lg p-4"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span className="text-lg">{q.icon}</span>
                <div>
                  <h3
                    id={`question-${q.type.toLowerCase()}`}
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {q.type}
                  </h3>
                  <p className="mt-1 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                    {q.example}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <strong>Triggered when:</strong> {q.trigger}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Clarification Response ─── */}
        <section>
          <h2
            id="clarification-response"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Clarification Response
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            When clarification is needed, the MCP server returns a structured response with a
            session ID and one or more questions. Agents answer using{' '}
            <code style={{ color: 'var(--color-accent)' }}>search_tools_respond</code>:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={clarificationResponse}
              language="json"
              filename="Clarification response payload"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Rich Context Shortcut ─── */}
        <section>
          <h2
            id="rich-context-shortcut"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Rich Context Shortcut
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            If you already know the context (language, deployment model, etc.), you can bypass
            clarification entirely by including it in the initial{' '}
            <code style={{ color: 'var(--color-accent)' }}>search_tools</code> call. The pipeline
            skips directly to Stage 2 with your filters pre-applied:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={richContextExample}
              language="typescript"
              filename="Skipping clarification with context"
              showLineNumbers
            />
          </div>

          <Callout type="tip" title="Faster Results">
            Agents can provide context upfront to get immediate results without clarification
            rounds. This is especially useful when the agent already has project context from
            analyzing a codebase.
          </Callout>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
