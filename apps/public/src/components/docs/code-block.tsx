'use client';

import { type ReactNode, useCallback, useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, filename, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const lines = code.split('\n');

  return (
    <div
      style={{
        background: 'var(--tp-surface-2)',
        border: '1px solid var(--tp-border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
      className="relative overflow-hidden"
    >
      {filename && (
        <div
          className="flex items-center justify-between px-4 py-2 text-xs font-medium"
          style={{
            background: 'var(--tp-surface-2)',
            borderBottom: '1px solid var(--tp-border-subtle)',
            color: 'var(--tp-text-secondary)',
          }}
        >
          <span className="font-mono">{filename}</span>
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
      )}

      {!filename && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {language && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--tp-accent-subtle)',
                color: 'var(--tp-accent-hover)',
              }}
            >
              {language}
            </span>
          )}
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
      )}

      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed" style={{ margin: 0 }}>
          <code className="font-mono" style={{ color: 'var(--tp-text-primary)' }}>
            {showLineNumbers
              ? lines.map((line, i) => {
                  const lineNum = i + 1;
                  return (
                    <LineWithNumber
                      key={`${lineNum}:${line}`}
                      lineNumber={lineNum}
                      totalLines={lines.length}
                    >
                      {line}
                    </LineWithNumber>
                  );
                })
              : code}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface CopyButtonProps {
  copied: boolean;
  onClick: () => void;
}

function CopyButton({ copied, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'var(--tp-surface-3)',
        color: copied ? '#22c55e' : 'var(--tp-text-muted)',
        border: '1px solid var(--tp-border-subtle)',
        cursor: 'pointer',
      }}
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? (
        <>
          <CheckIcon />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon />
          Copy
        </>
      )}
    </button>
  );
}

interface LineWithNumberProps {
  lineNumber: number;
  totalLines: number;
  children: ReactNode;
}

function LineWithNumber({ lineNumber, totalLines, children }: LineWithNumberProps) {
  const gutterWidth = String(totalLines).length;
  return (
    <span className="block">
      <span
        className="mr-4 inline-block select-none text-right"
        style={{
          color: 'var(--tp-text-muted)',
          width: `${gutterWidth}ch`,
          opacity: 0.5,
        }}
      >
        {lineNumber}
      </span>
      {children}
      {'\n'}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Copy"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Copied"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
