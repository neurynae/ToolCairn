import { GlassCard } from '@/components/ui/glass-card';

interface ToolMetadataProps {
  language: string;
  languages: string[];
  license: string;
  deploymentModels: string[];
  packageManagers: Record<string, string>;
}

const deploymentLabels: Record<string, string> = {
  'self-hosted': 'Self-Hosted',
  cloud: 'Cloud',
  embedded: 'Embedded',
  serverless: 'Serverless',
};

export function ToolMetadata({
  language,
  languages,
  license,
  deploymentModels,
  packageManagers,
}: ToolMetadataProps) {
  const secondaryLanguages = languages.filter((l) => l !== language);

  return (
    <GlassCard padding="lg" hover={false} as="section" className="flex flex-col gap-4">
      <h2
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Metadata
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Primary Language */}
        <Chip icon="🔤" label={language} accent />

        {/* Secondary Languages */}
        {secondaryLanguages.map((lang) => (
          <Chip key={lang} label={lang} />
        ))}

        {/* License */}
        {license && <Chip icon="📄" label={license} />}

        {/* Deployment Models */}
        {deploymentModels.map((model) => (
          <Chip key={model} icon="🚀" label={deploymentLabels[model] ?? model} />
        ))}
      </div>

      {/* Package Install Commands */}
      {Object.keys(packageManagers).length > 0 && (
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Install
          </span>
          <div className="flex flex-col gap-1.5">
            {Object.entries(packageManagers).map(([manager, command]) => (
              <code
                key={manager}
                className="rounded-md px-3 py-1.5 font-mono text-xs"
                style={{
                  background: 'var(--color-surface-0)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {command}
              </code>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Chip({
  label,
  icon,
  accent,
}: {
  label: string;
  icon?: string;
  accent?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: accent ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-surface-2)',
        color: accent ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        border: `1px solid ${accent ? 'rgba(99, 102, 241, 0.2)' : 'var(--color-border-subtle)'}`,
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  );
}
