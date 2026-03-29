import type { ToolHealthRow } from '@/app/api/admin/weights/route';

interface ToolHealthGridProps {
  tools: ToolHealthRow[];
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70
      ? 'bg-emerald-100 text-emerald-700'
      : pct >= 40
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-600';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {pct}%
    </span>
  );
}

export function ToolHealthGrid({ tools }: ToolHealthGridProps) {
  if (tools.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No tools found. Add tools to the graph first.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Tool</th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Category</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Health</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Stars</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">+90d</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Commits/30d</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Contributors</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Open Issues</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {tools.map((tool) => (
            <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 font-medium text-gray-900">{tool.displayName}</td>
              <td className="px-4 py-2.5 text-gray-500 capitalize">{tool.category}</td>
              <td className="px-4 py-2.5 text-right">
                <ScoreBadge score={tool.maintenanceScore} />
              </td>
              <td className="px-4 py-2.5 text-right text-gray-700">
                {tool.stars.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right text-emerald-600">
                +{tool.starsVelocity90d.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-700">{tool.commitVelocity30d}</td>
              <td className="px-4 py-2.5 text-right text-gray-700">{tool.contributorCount}</td>
              <td className="px-4 py-2.5 text-right text-gray-700">{tool.openIssues}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
