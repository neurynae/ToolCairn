'use client';

import { useState } from 'react';

interface StackConstraintsProps {
  deployment: string[];
  onDeploymentChange: (v: string[]) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  license: string;
  onLicenseChange: (v: string) => void;
}

const DEPLOYMENT_OPTIONS = ['self-hosted', 'cloud', 'embedded', 'serverless'] as const;
const LANGUAGE_PRESETS = ['Python', 'TypeScript', 'Go', 'Rust', 'Java', 'C#'] as const;
const LICENSE_OPTIONS = ['MIT', 'Apache-2.0', 'Any'] as const;

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-full px-3 py-1.5 text-sm font-medium transition-all"
      style={{
        background: selected
          ? 'var(--color-accent)'
          : hovered
            ? 'var(--color-surface-2)'
            : 'var(--color-surface-1)',
        color: selected ? '#fff' : 'var(--color-text-secondary)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
      }}
    >
      {label}
    </button>
  );
}

export function StackConstraints({
  deployment,
  onDeploymentChange,
  language,
  onLanguageChange,
  license,
  onLicenseChange,
}: StackConstraintsProps) {
  const [customLang, setCustomLang] = useState('');

  function toggleDeployment(option: string) {
    if (deployment.includes(option)) {
      onDeploymentChange(deployment.filter((d) => d !== option));
    } else {
      onDeploymentChange([...deployment, option]);
    }
  }

  function selectLanguage(lang: string) {
    onLanguageChange(language === lang ? '' : lang);
    setCustomLang('');
  }

  function handleCustomLang(value: string) {
    setCustomLang(value);
    onLanguageChange(value);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Deployment */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Deployment
        </span>
        <div className="flex flex-wrap gap-2">
          {DEPLOYMENT_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={deployment.includes(opt)}
              onClick={() => toggleDeployment(opt)}
            />
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Language
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {LANGUAGE_PRESETS.map((lang) => (
            <Chip
              key={lang}
              label={lang}
              selected={language === lang && !customLang}
              onClick={() => selectLanguage(lang)}
            />
          ))}
          <input
            type="text"
            placeholder="Other…"
            value={customLang}
            onChange={(e) => handleCustomLang(e.target.value)}
            className="rounded-full px-3 py-1.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--color-surface-1)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              width: '90px',
            }}
          />
        </div>
      </div>

      {/* License */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          License
        </span>
        <div className="flex flex-wrap gap-2">
          {LICENSE_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={license === opt}
              onClick={() => onLicenseChange(license === opt ? '' : opt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
