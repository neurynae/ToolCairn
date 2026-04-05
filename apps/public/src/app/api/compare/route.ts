import { MemgraphToolRepository } from '@toolpilot/graph';
import { enqueueIndexJob } from '@toolpilot/queue';
import { createCompareToolsHandler } from '@toolpilot/tools';
import { type NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { mcpToNextResponse, withProxyPost } from '@/lib/api/proxy';

const logger = pino({ name: '@toolpilot/public:api-compare' });

const graphRepo = new MemgraphToolRepository();
const handleCompare = createCompareToolsHandler({ graphRepo, enqueueIndexJob });

const CompareRequestSchema = z.object({
  tool_a: z.string().min(1).max(100),
  tool_b: z.string().min(1).max(100),
  use_case: z.string().max(500).optional(),
});

async function directHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = CompareRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    logger.info({ tool_a: parsed.data.tool_a, tool_b: parsed.data.tool_b }, 'compare direct');
    const mcpResult = await handleCompare({
      tool_a: parsed.data.tool_a,
      tool_b: parsed.data.tool_b,
      use_case: parsed.data.use_case,
    });
    return mcpToNextResponse(mcpResult);
  } catch (e) {
    logger.error({ err: e }, 'compare failed');
    return NextResponse.json(
      { ok: false, error: 'compare_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = withProxyPost('/graph/compare', directHandler);
