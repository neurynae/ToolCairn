import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Rich Context Guide — ToolPilot Docs',
  description:
    'Skip clarification rounds by providing context filters upfront for faster, more accurate results.',
};

export default function RichContextPage() {
  const { prev, next } = getPrevNext('/docs/guides/rich-context');

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'Rich Context' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ marginTop: 24, marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.20)',
            }}
          >
            Advanced
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ~5 min read
          </span>
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}
        >
          Rich Context Guide
        </h1>
        <p
          className="mt-3 text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
        >
          Clarification rounds add latency. If your agent already knows the
          project&rsquo;s language, framework, and constraints, skip them entirely by
          providing context filters upfront.
        </p>
      </header>

      {/* ─── What You'll Learn ─── */}
      <section style={{ marginBottom: 40 }}>
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.04))',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <h2
            id="what-youll-learn"
            className="mb-3 text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-accent)' }}
          >
            What you&rsquo;ll learn
          </h2>
          <ul
            className="space-y-1.5 text-sm"
            style={{ color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 20 }}
          >
            <li>Why clarification happens and when to skip it</li>
            <li>All available context filters and what they do</li>
            <li>How to go from a vague query to instant results</li>
            <li>Best practices for agents that auto-detect project context</li>
          </ul>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="the-problem"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          The problem: unnecessary round-trips
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ToolPilot&rsquo;s Guided Discovery system asks follow-up questions when a query
          is ambiguous. That&rsquo;s great for interactive use — but in automated
          pipelines or when an AI agent already has full project context, those extra
          round-trips add latency without adding value.
        </p>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          A bare query like this will almost always trigger clarification:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "query": "database"
}`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ToolPilot needs to know: SQL or NoSQL? What language? Self-hosted or cloud?
          What&rsquo;s the scale? Without answers, it can&rsquo;t rank meaningfully. The
          solution is to provide that context upfront.
        </p>
      </section>

      {/* ─── The Solution ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="the-solution"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          The solution: context filters
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Add a <code>context</code> object to your <code>search_tools</code> call. This
          gives ToolPilot the signal it needs to skip clarification and go straight to
          results.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "query": "database",
  "context": {
    "language": "Python",
    "category": "orm",
    "deployment": "self-hosted"
  }
}`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          With those three filters, ToolPilot knows exactly what you mean: a self-hosted
          ORM for Python. No follow-up needed — you get results on the first call.
        </p>
      </section>

      {/* ─── Side by Side ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="comparison"
          className="mb-4 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Side by side: without vs. with context
        </h2>
        <CodeTabs
          tabs={[
            {
              label: 'Without context',
              language: 'json',
              code: `// Request
{ "query": "database" }

// Response — clarification required
{
  "type": "clarification",
  "query_id": "xyz-789",
  "questions": [
    { "key": "category", "question": "What type of database?", "options": ["relational", "document", "key-value", "graph"] },
    { "key": "language", "question": "Primary language?", "options": ["TypeScript", "Python", "Go", "Java"] },
    { "key": "deployment", "question": "Deployment model?", "options": ["self-hosted", "managed", "embedded"] }
  ]
}

// Requires a second call with search_tools_respond...`,
            },
            {
              label: 'With context',
              language: 'json',
              code: `// Request
{
  "query": "database",
  "context": {
    "language": "Python",
    "category": "orm",
    "deployment": "self-hosted"
  }
}

// Response — immediate results
{
  "type": "results",
  "recommended": {
    "name": "sqlalchemy",
    "health_tier": "healthy",
    "health_score": 93,
    "why": "Python's most mature ORM — extensive docs, self-hosted, strong community"
  },
  "alternatives": [
    { "name": "django-orm", "health_score": 90, "why": "Great if you're using Django" },
    { "name": "tortoise-orm", "health_score": 72, "why": "Async-first alternative" }
  ]
}`,
            },
          ]}
        />
      </section>

      {/* ─── Available Filters ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="available-context-filters"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Available context filters
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          You can provide any combination of these filters. Each one narrows the search
          and reduces the likelihood of clarification.
        </p>
        <div
          style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-2)' }}>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  Filter
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  Description
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  Examples
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  filter: 'language',
                  description: 'Programming language of the project',
                  examples: '"TypeScript", "Python", "Rust", "Go"',
                },
                {
                  filter: 'category',
                  description: 'Tool category or function',
                  examples: '"database", "testing", "ci-cd", "orm"',
                },
                {
                  filter: 'license',
                  description: 'Preferred license type',
                  examples: '"MIT", "Apache-2.0", "BSD-3-Clause"',
                },
                {
                  filter: 'deployment',
                  description: 'Deployment model',
                  examples: '"self-hosted", "cloud", "embedded"',
                },
              ].map((row) => (
                <tr key={row.filter}>
                  <td
                    className="px-4 py-3 text-sm font-mono font-medium"
                    style={{
                      color: 'var(--color-accent)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {row.filter}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {row.description}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-mono"
                    style={{
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {row.examples}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          className="mt-3 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          All filters are optional. Providing even one significantly reduces clarification
          frequency.
        </p>
      </section>

      {/* ─── When to use each approach ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="when-to-use-which-approach"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          When to use which approach
        </h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {/* Rich context card */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3
              id="use-rich-context"
              className="mb-2 text-sm font-bold"
              style={{ color: '#22c55e' }}
            >
              ✅ Use rich context when…
            </h3>
            <ul
              className="space-y-1.5 text-sm"
              style={{ color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 18 }}
            >
              <li>Your agent already analyzed the codebase</li>
              <li>You know the language, framework, and deployment target</li>
              <li>Speed matters — CI/CD pipelines, automated workflows</li>
              <li>The query is specific enough that follow-ups waste time</li>
            </ul>
          </div>

          {/* Clarification card */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3
              id="let-clarification-happen"
              className="mb-2 text-sm font-bold"
              style={{ color: '#6366f1' }}
            >
              💬 Let clarification happen when…
            </h3>
            <ul
              className="space-y-1.5 text-sm"
              style={{ color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 18 }}
            >
              <li>The user is exploring — they&rsquo;re not sure what they need</li>
              <li>The query is intentionally broad (&ldquo;what testing tools exist?&rdquo;)</li>
              <li>You want ToolPilot to surface options the user hadn&rsquo;t considered</li>
              <li>Interactive latency is acceptable</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Smart agent pattern ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="smart-agent-pattern"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Smart agent pattern: auto-detect context
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The most effective agents don&rsquo;t wait for the user to provide context —
          they extract it from the codebase automatically. Here&rsquo;s the pattern:
        </p>
        <CodeBlock
          language="typescript"
          filename="agent-search.ts"
          showLineNumbers
          code={`import { readFile } from 'fs/promises';

async function buildSearchContext(projectRoot: string) {
  const context: Record<string, string> = {};

  // Detect language from package.json or pyproject.toml
  try {
    const pkg = JSON.parse(await readFile(\`\${projectRoot}/package.json\`, 'utf-8'));
    context.language = pkg.devDependencies?.typescript ? 'TypeScript' : 'JavaScript';
  } catch {
    try {
      await readFile(\`\${projectRoot}/pyproject.toml\`, 'utf-8');
      context.language = 'Python';
    } catch {
      // Language unknown — let clarification handle it
    }
  }

  // Detect deployment from Docker or cloud configs
  try {
    await readFile(\`\${projectRoot}/Dockerfile\`, 'utf-8');
    context.deployment = 'self-hosted';
  } catch {
    // No Dockerfile — might be cloud or embedded
  }

  return context;
}`}
        />
        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Smart agents analyze the project first">
            Analyze the current project&rsquo;s <code>package.json</code>,{' '}
            <code>requirements.txt</code>, or <code>go.mod</code> to automatically
            provide language and framework context. This turns every search into a
            zero-clarification lookup.
          </Callout>
        </div>
      </section>

      {/* ─── Recap ─── */}
      <section style={{ marginBottom: 8 }}>
        <h2
          id="recap"
          className="mb-3 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Recap
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Rich context is a power-user feature. By adding a <code>context</code> object
          with <code>language</code>, <code>category</code>, <code>license</code>, or{' '}
          <code>deployment</code> filters to your <code>search_tools</code> call, you
          skip clarification entirely and get instant results. For the best experience,
          build agents that auto-detect project context from the codebase.
        </p>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
