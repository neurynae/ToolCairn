import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MemgraphToolRepository } from '@toolpilot/graph';
import { getHealthTier } from '@/lib/format-health';
import { ToolHeader } from '@/components/tool/tool-header';
import { ToolHealthWidget } from '@/components/tool/tool-health-widget';
import { ToolMetadata } from '@/components/tool/tool-metadata';
import { ToolDocsPanel } from '@/components/tool/tool-docs-panel';
import { ToolRelated } from '@/components/tool/tool-related';
import { ToolGraphMini } from '@/components/tool/tool-graph-mini';
import { ToolIssueEmbed } from '@/components/tool/tool-issue-embed';

const repo = new MemgraphToolRepository();

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `${decoded} — ToolPilot`,
    description: `Tool profile for ${decoded}`,
  };
}

export default async function ToolProfilePage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const toolResult = await repo.findByName(decoded);
  if (!toolResult.ok || !toolResult.data) notFound();

  const tool = toolResult.data;

  const [relatedResult, neighborhoodResult] = await Promise.all([
    repo.getRelated(decoded, 10),
    repo.getToolNeighborhood(decoded),
  ]);

  const related = relatedResult.ok
    ? relatedResult.data.map((t) => ({
        name: t.name,
        display_name: t.display_name,
        category: t.category,
        maintenance_score: t.health.maintenance_score,
      }))
    : [];

  const neighborhood =
    neighborhoodResult.ok && neighborhoodResult.data
      ? {
          center: { name: neighborhoodResult.data.center.name },
          neighbors: neighborhoodResult.data.neighbors.map((n) => ({
            tool: { name: n.tool.name },
            edgeType: n.edgeType,
            weight: n.weight,
          })),
        }
      : null;

  const tier = getHealthTier(tool.health.maintenance_score);

  return (
    <main
      className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      style={{ color: 'var(--tp-text-primary)' }}
    >
      {/* Header */}
      <ToolHeader
        name={tool.name}
        displayName={tool.display_name}
        category={tool.category}
        githubUrl={tool.github_url}
        tier={tier}
      />

      {/* Health + Graph */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <ToolHealthWidget health={tool.health} />
        <ToolGraphMini neighborhood={neighborhood} />
      </div>

      {/* Metadata */}
      <ToolMetadata
        language={tool.language}
        languages={tool.languages}
        license={tool.license}
        deploymentModels={tool.deployment_models}
        packageManagers={tool.package_managers}
      />

      {/* Documentation */}
      <ToolDocsPanel docs={tool.docs} githubUrl={tool.github_url} />

      {/* Related */}
      <ToolRelated related={related} />

      {/* Issue Checker */}
      <ToolIssueEmbed toolName={tool.name} />
    </main>
  );
}
