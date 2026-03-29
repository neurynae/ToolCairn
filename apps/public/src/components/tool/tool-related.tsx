import Link from 'next/link';
import { CategoryBadge } from '@/components/ui/category-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { getHealthTier } from '@/lib/format-health';

interface RelatedTool {
  name: string;
  display_name: string;
  category: string;
  maintenance_score: number;
}

interface ToolRelatedProps {
  related: RelatedTool[];
}

export function ToolRelated({ related }: ToolRelatedProps) {
  if (related.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Related Tools
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((tool) => (
          <Link key={tool.name} href={`/tool/${encodeURIComponent(tool.name)}`}>
            <GlassCard padding="md" className="flex flex-col gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {tool.display_name}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={tool.category} size="sm" />
                <HealthTierBadge tier={getHealthTier(tool.maintenance_score)} size="sm" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
