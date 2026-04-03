import type { ToolHealthRow } from '@/app/api/admin/weights/route';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ToolHealthGridProps {
  tools: ToolHealthRow[];
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const className =
    pct >= 70
      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
      : pct >= 40
        ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
        : 'text-red-400 border-red-400/30 bg-red-400/10';
  return (
    <Badge variant="outline" className={className}>
      {pct}%
    </Badge>
  );
}

export function ToolHealthGrid({ tools }: ToolHealthGridProps) {
  if (tools.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No tools found. Add tools to the graph first.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Health</TableHead>
              <TableHead className="text-right">Stars</TableHead>
              <TableHead className="text-right">+90d</TableHead>
              <TableHead className="text-right">Commits/30d</TableHead>
              <TableHead className="text-right">Contributors</TableHead>
              <TableHead className="text-right">Open Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell className="font-medium">{tool.displayName}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{tool.category}</TableCell>
                <TableCell className="text-right">
                  <ScoreBadge score={tool.maintenanceScore} />
                </TableCell>
                <TableCell className="text-right">{tool.stars.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-400">
                  +{tool.starsVelocity90d.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{tool.commitVelocity30d}</TableCell>
                <TableCell className="text-right">{tool.contributorCount}</TableCell>
                <TableCell className="text-right">{tool.openIssues}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
