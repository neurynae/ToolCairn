import type { ToolHealthRow } from '@/app/api/admin/weights/route';
import { Card, CardContent } from '@/components/ui/card';

interface EmergingToolsListProps {
  tools: ToolHealthRow[];
}

export function EmergingToolsList({ tools }: EmergingToolsListProps) {
  const emerging = [...tools].sort((a, b) => b.starsVelocity90d - a.starsVelocity90d).slice(0, 10);

  if (emerging.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          No data.
        </CardContent>
      </Card>
    );
  }

  const max = emerging[0]?.starsVelocity90d || 1;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {emerging.map((tool) => {
          const pct = (tool.starsVelocity90d / max) * 100;
          return (
            <div key={tool.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium truncate max-w-[180px]">{tool.displayName}</span>
                <span className="text-emerald-400 font-semibold text-xs ml-2 shrink-0">
                  +{tool.starsVelocity90d.toLocaleString()} ★
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
