'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GraphControlsProps {
  categories: string[];
  selectedCategory: string;
  nodeLimit: number;
  onCategoryChange: (category: string) => void;
  onNodeLimitChange: (limit: number) => void;
  totalNodes: number;
  totalEdges: number;
}

const LIMITS = [50, 100, 200, 500] as const;

export function GraphControls({
  categories,
  selectedCategory,
  nodeLimit,
  onCategoryChange,
  onNodeLimitChange,
  totalNodes,
  totalEdges,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap px-3 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Category</span>
        <Select value={selectedCategory || ''} onValueChange={(v) => onCategoryChange(v ?? '')}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Limit</span>
        <Select
          value={String(nodeLimit)}
          onValueChange={(v) => onNodeLimitChange(Number(v ?? '50'))}
        >
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMITS.map((l) => (
              <SelectItem key={l} value={String(l)}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{totalNodes}</span> nodes
        </span>
        <span>
          <span className="font-semibold text-foreground">{totalEdges}</span> edges
        </span>
      </div>
    </div>
  );
}
