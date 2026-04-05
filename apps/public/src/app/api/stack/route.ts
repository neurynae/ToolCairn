import { MemgraphToolRepository } from '@toolpilot/graph';
import { createGetStackHandler } from '@toolpilot/tools';
import { type NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { mcpToNextResponse, withProxyPost } from '@/lib/api/proxy';

const logger = pino({ name: '@toolpilot/public:api-stack' });

const graphRepo = new MemgraphToolRepository();
const handleGetStack = createGetStackHandler({ graphRepo });

const GetStackSchema = z.object({
  use_case: z.string().min(1),
  constraints: z
    .object({
      deployment_model: z.enum(['self-hosted', 'cloud', 'embedded', 'serverless']).optional(),
      language: z.string().optional(),
      license: z.string().optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).default(5),
});

async function directHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = GetStackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    logger.info({ use_case: parsed.data.use_case }, 'get_stack direct');
    const mcpResult = await handleGetStack({
      use_case: parsed.data.use_case,
      constraints: parsed.data.constraints,
      limit: parsed.data.limit,
    });
    return mcpToNextResponse(mcpResult);
  } catch (e) {
    logger.error({ err: e }, 'get_stack failed');
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = withProxyPost('/graph/stack', directHandler);
