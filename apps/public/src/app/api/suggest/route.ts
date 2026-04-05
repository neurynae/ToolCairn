import { PrismaClient } from '@toolpilot/db';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: '@toolpilot/public:api-suggest' });
const prisma = new PrismaClient();

const SuggestRequestSchema = z.object({
  suggestion_type: z.enum(['new_tool', 'new_edge', 'update_health', 'new_use_case']),
  node_type: z.string().optional(),
  node_data: z.object({
    name: z.string().optional(),
    display_name: z.string().optional(),
    github_url: z.string().url().optional(),
    description: z.string().max(500).optional(),
  }).optional(),
  confidence: z.number().min(0.1).max(1.0).default(0.7),
  source: z.string().default('user_report'),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = SuggestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { suggestion_type, node_type, node_data, confidence, source } = parsed.data;
    logger.info({ suggestion_type }, 'suggest called');

    // Store as a staged node in PostgreSQL for human review
    const staged = await prisma.stagedNode.create({
      data: {
        node_type: node_type ?? suggestion_type,
        node_data: node_data ?? {},
        confidence,
        source,
        graduated: false,
      },
    });

    return NextResponse.json(
      { ok: true, data: { id: staged.id, status: 'staged_for_review', message: 'Suggestion submitted for review.' } },
      { status: 201 },
    );
  } catch (e) {
    logger.error({ err: e }, 'suggest failed');
    return NextResponse.json(
      { ok: false, error: 'suggest_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
