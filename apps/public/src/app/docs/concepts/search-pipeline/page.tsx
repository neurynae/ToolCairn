import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Pipeline – ToolPilot Docs',
  description:
    'The 4-stage search pipeline: hybrid retrieval, context filtering, graph reranking, and intelligent selection.',
};

const CURRENT_HREF = '/docs/concepts/search-pipeline';

const pipelineDiagram = `  ┌──────────────────────────────────────────────────────────────┐
  │                        User Query                          │
  │              "best ORM for TypeScript"                      │
  └──────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Stage 1: Hybrid Retrieval                                  │
  │  ┌─────────────────┐    ┌──────────────────────┐            │
  │  │  BM25 Text      │    │  Qdrant Vector       │            │
  │  │  (in-memory)     │    │  (Nomic 768d)        │            │
  │  └────────┬────────┘    └──────────┬───────────┘            │
  │           └────────┬───────────────┘                        │
  │                    ▼                                        │
  │          Reciprocal Rank Fusion (RRF)                       │
  └──────────────────────┬─────────────────────────────────────┘
                         │  Top N candidates
                         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Stage 2: Filter & Narrow                                   │
  │  Apply context filters: language, category, license, deploy │
  │  Graceful degradation → progressively relax if empty        │
  └──────────────────────┬─────────────────────────────────────┘
                         │  Filtered candidates
                         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Stage 3: Graph Reranking                                   │
  │  Cypher traversal of tool relationships in Memgraph         │
  │  finalScore = 0.6 × graphScore + 0.4 × stage2Score         │
  └──────────────────────┬─────────────────────────────────────┘
                         │  Reranked results
                         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Stage 4: Selection                                         │
  │  < 20% gap + health split → Two recommendations             │
  │  Otherwise              → Single recommendation             │
  └──────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
                   ┌───────────┐
                   │  Result   │
                   └───────────┘`;

const rrfFormula = `RRF score for document d:

  score(d) = Σ  1 / (k + rank_i(d))
             i

Where:
  k     = 60 (smoothing constant)
  i     = each ranker (BM25, vector)
  rank  = position in that ranker's result list`;

const filterExample = `// Context filters applied as Qdrant payload filters
{
  "language": "typescript",
  "category": "orm",
  "license": "MIT",
  "deployment": "self-hosted"
}

// Progressive relaxation order:
// 1. All filters → results? Done.
// 2. Drop deployment → results? Done.
// 3. Drop license → results? Done.
// 4. Drop category → results? Done.
// 5. Language only → guaranteed results.`;

export default function SearchPipelinePage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Search Pipeline' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            4-Stage Search Pipeline
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Every <code style={{ color: 'var(--color-accent)' }}>search_tools</code> call flows
            through a four-stage pipeline that combines text search, vector similarity, graph
            relationships, and intelligent selection to find the best tool for the job.
          </p>
        </section>

        {/* ─── Pipeline Overview ─── */}
        <section>
          <h2
            id="pipeline-overview"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Pipeline Overview
          </h2>
          <div className="mt-4">
            <CodeBlock code={pipelineDiagram} filename="Search pipeline flow" />
          </div>
        </section>

        {/* ─── Stage 1 ─── */}
        <section>
          <h2
            id="stage-1-hybrid-retrieval"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Stage 1: Hybrid Retrieval
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The first stage casts a wide net using two complementary retrieval methods running in
            parallel:
          </p>

          <div className="mt-4 space-y-4">
            <div
              className="rounded-lg p-4"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                id="bm25-text-search"
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                BM25 Text Search
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
              >
                A classical term-frequency/inverse-document-frequency search over tool names,
                descriptions, and categories. Runs against an in-memory index for sub-millisecond
                latency. Excels at exact name matches and keyword queries.
              </p>
            </div>

            <div
              className="rounded-lg p-4"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                id="vector-search"
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Vector Search (Optional)
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
              >
                Semantic similarity search using <strong>Nomic Embed Code</strong> (768-dimensional
                embeddings) stored in Qdrant. Captures conceptual meaning — so a query for
                &ldquo;database migration tool&rdquo; matches tools that don&rsquo;t literally
                contain those words. Optional because BM25 alone handles many queries well.
              </p>
            </div>
          </div>

          <p
            className="mt-4 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Results from both rankers are merged using <strong>Reciprocal Rank Fusion (RRF)</strong>
            , which combines ranked lists without requiring score normalization:
          </p>
          <div className="mt-3">
            <CodeBlock code={rrfFormula} filename="Reciprocal Rank Fusion" />
          </div>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            If both BM25 and vector search return empty results, the pipeline falls back to ranking
            by <code style={{ color: 'var(--color-accent)' }}>maintenance_score</code>, ensuring a
            query always returns something useful.
          </p>
        </section>

        {/* ─── Stage 2 ─── */}
        <section>
          <h2
            id="stage-2-filter-narrow"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Stage 2: Filter &amp; Narrow
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Stage 2 applies context from the user&rsquo;s clarification answers (or upfront context
            filters) to narrow the candidate set. Filters are applied as Qdrant payload filters or
            in-memory predicates depending on the retrieval path.
          </p>
          <div className="mt-4">
            <CodeBlock
              code={filterExample}
              language="typescript"
              filename="Context filter application"
              showLineNumbers
            />
          </div>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The key design principle is <strong>graceful degradation</strong>: if the full filter
            set returns zero results, constraints are progressively relaxed (least important first)
            until results are found. This prevents dead-end searches while respecting user
            preferences.
          </p>
        </section>

        {/* ─── Stage 3 ─── */}
        <section>
          <h2
            id="stage-3-graph-reranking"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Stage 3: Graph Reranking
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            This is where ToolPilot&rsquo;s graph database shines. A Cypher query traverses
            relationships in Memgraph to compute a <strong>graph score</strong> for each candidate
            based on:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              Number and strength of{' '}
              <code style={{ color: 'var(--color-accent)' }}>RELATED_TO</code> edges to other
              highly-ranked candidates
            </li>
            <li>Ecosystem density — tools in rich ecosystems score higher</li>
            <li>Health tier bonus — actively maintained tools get a slight uplift</li>
          </ul>
          <div
            className="mt-4 rounded-lg p-4"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
              <strong>finalScore</strong> = 0.6 × graphScore + 0.4 × stage2Score
            </p>
          </div>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The 60/40 weighting gives graph relationships the majority influence, since
            ToolPilot&rsquo;s core value proposition is ecosystem-aware recommendations. The
            stage2Score acts as a relevance anchor to prevent graph popularity from dominating.
          </p>
        </section>

        {/* ─── Stage 4 ─── */}
        <section>
          <h2
            id="stage-4-selection"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Stage 4: Selection
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The final stage decides how many tools to recommend:
          </p>
          <div className="mt-4 space-y-3">
            <div
              className="rounded-lg p-4"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                id="two-option-recommendation"
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Two-Option Recommendation
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
              >
                Triggered when the top 2 candidates are within a <strong>20% score gap</strong> AND
                have a <strong>stable/emerging health split</strong> (e.g., one established tool and
                one rising alternative). Gives agents a nuanced choice rather than a false single
                answer.
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                id="single-recommendation"
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Single Recommendation
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
              >
                When one tool is a clear winner (large score gap or similar health profiles), the
                pipeline returns a single confident recommendation with full context.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Tip ─── */}
        <section>
          <Callout type="tip" title="Skip Clarification">
            You can skip the clarification round by providing context filters directly in the{' '}
            <code>search_tools</code> call. This sends your query straight through all four stages
            with pre-applied filters.
          </Callout>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
