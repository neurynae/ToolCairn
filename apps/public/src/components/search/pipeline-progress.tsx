'use client';

interface PipelineProgressProps {
  candidateCount: number;
  stage: 'searching' | 'narrowing' | 'complete';
  resultCount?: number;
}

export function PipelineProgress({ candidateCount, stage, resultCount }: PipelineProgressProps) {
  return (
    <div className="fade-up mt-10 flex flex-col items-center gap-4">
      {/* Animated pipeline dots */}
      <div className="flex items-center gap-3">
        <PipelineDot active={stage === 'searching'} done={stage !== 'searching'} />
        <PipelineConnector active={stage !== 'searching'} />
        <PipelineDot active={stage === 'narrowing'} done={stage === 'complete'} />
        <PipelineConnector active={stage === 'complete'} />
        <PipelineDot active={stage === 'complete'} done={stage === 'complete'} />
      </div>

      {/* Status text */}
      <div className="text-center">
        {stage === 'searching' && (
          <p
            className="text-sm font-medium"
            style={{
              color: 'var(--color-accent)',
              animation: 'progress-pulse 1.5s ease-in-out infinite',
            }}
          >
            Analyzing your query...
          </p>
        )}

        {stage === 'narrowing' && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <span style={{ color: 'var(--color-accent)' }}>{candidateCount}</span> candidates
              found
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Narrowing down to your best match...
            </p>
          </div>
        )}

        {stage === 'complete' && (
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {candidateCount} → {resultCount ?? 1}{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>tools matched</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function PipelineDot({ active, done }: { active: boolean; done: boolean }) {
  const bg = done
    ? 'var(--color-accent)'
    : active
      ? 'var(--color-accent-glow)'
      : 'var(--color-surface-3)';

  return (
    <span
      className="inline-block h-3 w-3 rounded-full transition-all duration-300"
      style={{
        background: bg,
        boxShadow: active ? '0 0 12px var(--color-accent-glow)' : 'none',
      }}
    />
  );
}

function PipelineConnector({ active }: { active: boolean }) {
  return (
    <span
      className="inline-block h-0.5 w-8 rounded-full transition-all duration-500"
      style={{
        background: active
          ? 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))'
          : 'var(--color-surface-3)',
      }}
    />
  );
}
