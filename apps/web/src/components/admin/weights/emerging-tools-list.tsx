import type { ToolHealthRow } from '@/app/api/admin/weights/route';

interface EmergingToolsListProps {
  tools: ToolHealthRow[];
}

/** Tools with the highest 90-day star velocity — top 10 */
export function EmergingToolsList({ tools }: EmergingToolsListProps) {
  const emerging = [...tools].sort((a, b) => b.starsVelocity90d - a.starsVelocity90d).slice(0, 10);

  if (emerging.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No data.</p>;
  }

  const max = emerging[0]?.starsVelocity90d || 1;

  return (
    <ul className="space-y-2">
      {emerging.map((tool) => {
        const pct = (tool.starsVelocity90d / max) * 100;
        return (
          <li key={tool.id}>
            <div className="flex items-center justify-between text-sm mb-0.5">
              <span className="font-medium text-gray-800 truncate max-w-[200px]">
                {tool.displayName}
              </span>
              <span className="text-emerald-600 font-semibold text-xs ml-2 shrink-0">
                +{tool.starsVelocity90d.toLocaleString()} ★
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
