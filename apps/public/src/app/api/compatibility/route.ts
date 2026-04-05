import { MemgraphToolRepository } from '@toolpilot/graph';
import { createCheckCompatibilityHandler } from '@toolpilot/tools';
import { type NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { mcpToNextResponse, withProxyPost } from '@/lib/api/proxy';

const logger = pino({ name: '@toolpilot/public:api-compatibility' });

const graphRepo = new MemgraphToolRepository();
const handleCompatibility = createCheckCompatibilityHandler({ graphRepo });

const CompatibilityRequestSchema = z.object({
  tool_a: z.string().min(1).max(100),
  tool_b: z.string().min(1).max(100),
});

async function directHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = CompatibilityRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    logger.info({ tool_a: parsed.data.tool_a, tool_b: parsed.data.tool_b }, 'compatibility direct');
    // Handler includes fuzzy name resolution (resolveToolName) for e.g. "nextjs" → "next.js"
    const mcpResult = await handleCompatibility({
      tool_a: parsed.data.tool_a,
      tool_b: parsed.data.tool_b,
    });
    return mcpToNextResponse(mcpResult);
  } catch (e) {
    logger.error({ err: e }, 'compatibility check failed');
    return NextResponse.json(
      { ok: false, error: 'compatibility_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = withProxyPost('/graph/compatibility', directHandler);
