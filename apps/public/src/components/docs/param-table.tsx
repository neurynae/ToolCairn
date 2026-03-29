interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

interface ParamTableProps {
  params: Param[];
}

export function ParamTable({ params }: ParamTableProps) {
  if (params.length === 0) return null;

  return (
    <>
      {/* Desktop table */}
      <div
        className="hidden overflow-hidden md:block"
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-2)' }}>
              {['Name', 'Type', 'Required', 'Default', 'Description'].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {params.map((param, index) => (
              <tr
                key={param.name}
                style={{
                  background: index % 2 === 0 ? 'var(--color-surface-1)' : 'var(--color-surface-0)',
                  borderBottom:
                    index < params.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
                }}
              >
                <td className="px-4 py-3">
                  <code className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>
                    {param.name}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code
                    className="font-mono text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {param.type}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <RequiredBadge required={param.required} />
                </td>
                <td className="px-4 py-3">
                  {param.default ? (
                    <code
                      className="font-mono text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {param.default}
                    </code>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {param.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {params.map((param) => (
          <div
            key={param.name}
            className="flex flex-col gap-2 p-4"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="flex items-center justify-between">
              <code
                className="font-mono text-sm font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                {param.name}
              </code>
              <RequiredBadge required={param.required} />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: 'var(--color-text-muted)' }}>Type:</span>
              <code className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {param.type}
              </code>
            </div>

            {param.default && (
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: 'var(--color-text-muted)' }}>Default:</span>
                <code className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                  {param.default}
                </code>
              </div>
            )}

            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--color-text-secondary)', margin: 0, marginTop: '4px' }}
            >
              {param.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function RequiredBadge({ required }: { required: boolean }) {
  if (required) {
    return (
      <span
        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          background: 'var(--color-accent-subtle)',
          color: 'var(--color-accent-hover)',
        }}
      >
        Required
      </span>
    );
  }

  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: 'var(--color-surface-3)',
        color: 'var(--color-text-muted)',
      }}
    >
      Optional
    </span>
  );
}
