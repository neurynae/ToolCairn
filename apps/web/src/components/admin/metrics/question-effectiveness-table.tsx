import type { ClarificationEffectiveness } from '@/lib/admin/metrics.service';

interface QuestionEffectivenessTableProps {
  data: ClarificationEffectiveness[];
}

export function QuestionEffectivenessTable({ data }: QuestionEffectivenessTableProps) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No clarification data yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-500">Question</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Asked</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Answered</th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-500">Answer Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((row) => {
            const ratePct = Math.round(row.answerRate * 100);
            const rateColor =
              ratePct >= 70
                ? 'text-emerald-600'
                : ratePct >= 40
                  ? 'text-amber-600'
                  : 'text-red-500';
            return (
              <tr key={row.question} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-800 max-w-xs truncate">{row.question}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{row.totalAsked}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{row.answeredCount}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${rateColor}`}>{ratePct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
