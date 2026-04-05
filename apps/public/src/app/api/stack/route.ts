import { PrismaClient } from '@toolpilot/db';
import { createGetStackHandler } from '@toolpilot/tools';
import { SearchPipeline, SearchSessionManager } from '@toolpilot/search';
import { type NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { mcpToNextResponse, withProxyPost } from '@/lib/api/proxy';

const logger = pino({ name: '@toolpilot/public:api-stack' });

// Lazy-init pipeline — only created in directHandler (local dev, no TOOLPILOT_API_URL).
// In production, withProxyPost short-circuits to the VPS before this is ever called.
let _handleGetStack: ReturnType<typeof createGetStackHandler> | null = null;
function getHandler() {
  if (!_handleGetStack) {
    const prisma = new PrismaClient();
    const sessionManager = new SearchSessionManager(prisma);
    const pipeline = new SearchPipeline(sessionManager);
    _handleGetStack = createGetStackHandler({ pipeline });
  }
  return _handleGetStack;
}

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
    const mcpResult = await getHandler()({
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
