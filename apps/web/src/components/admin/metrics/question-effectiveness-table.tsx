import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClarificationEffectiveness } from '@/lib/admin/metrics.service';

interface QuestionEffectivenessTableProps {
  data: ClarificationEffectiveness[];
}

export function QuestionEffectivenessTable({ data }: QuestionEffectivenessTableProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No clarification data yet.</p>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="text-right">Asked</TableHead>
              <TableHead className="text-right">Answered</TableHead>
              <TableHead className="text-right">Answer Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const ratePct = Math.round(row.answerRate * 100);
              const rateColor =
                ratePct >= 70
                  ? 'text-emerald-400'
                  : ratePct >= 40
                    ? 'text-amber-400'
                    : 'text-red-400';
              return (
                <TableRow key={row.question}>
                  <TableCell className="max-w-xs truncate">{row.question}</TableCell>
                  <TableCell className="text-right">{row.totalAsked}</TableCell>
                  <TableCell className="text-right">{row.answeredCount}</TableCell>
                  <TableCell className={`text-right font-medium ${rateColor}`}>
                    {ratePct}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
