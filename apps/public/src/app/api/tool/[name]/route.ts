import { MemgraphToolRepository } from '@toolpilot/graph';
import { NextResponse } from 'next/server';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/public:api-tool' });
const repo = new MemgraphToolRepository();

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: 'Tool name is required' },
        { status: 400 },
      );
    }

    const decodedName = decodeURIComponent(name);

    // 1. Find tool by name
    const toolResult = await repo.findByName(decodedName);
    if (!toolResult.ok) {
      return NextResponse.json(
        { ok: false, error: 'db_error', message: toolResult.error.message },
        { status: 500 },
      );
    }
    if (!toolResult.data) {
      return NextResponse.json(
        { ok: false, error: 'tool_not_found', message: `Tool '${decodedName}' not found` },
        { status: 404 },
      );
    }

    // 2. Get related tools
    const relatedResult = await repo.getRelated(decodedName, 10);
    const related = relatedResult.ok
      ? relatedResult.data.map((t) => ({
          name: t.name,
          display_name: t.display_name,
          category: t.category,
          maintenance_score: t.health.maintenance_score,
        }))
      : [];

    if (!relatedResult.ok) {
      logger.warn({ tool: decodedName, err: relatedResult.error }, 'Failed to fetch related tools');
    }

    // 3. Get tool neighborhood for mini graph
    let neighborhood: unknown = null;
    try {
      const neighborhoodResult = await repo.getToolNeighborhood(decodedName);
      if (neighborhoodResult.ok && neighborhoodResult.data) {
        neighborhood = neighborhoodResult.data;
      }
    } catch (err) {
      logger.warn({ tool: decodedName, err }, 'getToolNeighborhood failed');
    }

    logger.info({ tool: decodedName, relatedCount: related.length }, 'tool profile fetched');

    return NextResponse.json({
      ok: true,
      data: {
        tool: toolResult.data,
        related,
        neighborhood,
      },
    });
  } catch (e) {
    logger.error({ err: e }, 'get tool failed');
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
