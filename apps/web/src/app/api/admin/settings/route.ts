import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import pino from 'pino';
import { prisma } from '@/lib/admin/prisma';
import { PROXY_ENABLED, proxyPatch, withProxyGet } from '@/lib/admin/api-proxy';

const logger = pino({ name: 'api:admin:settings' });

const PatchSettingsSchema = z.object({
  reindex_scheduler_enabled: z.boolean().optional(),
  discovery_scheduler_enabled: z.boolean().optional(),
  discovery_topics: z.array(z.string().min(1)).optional(),
  discovery_batch_size: z.number().int().min(1).max(100).optional(),
  discovery_interval_hours: z.number().int().min(1).max(168).optional(),
  discovery_min_stars: z.number().int().min(0).optional(),
  discovery_last_pushed_days: z.number().int().min(1).max(365).optional(),
});

async function directGET(): Promise<NextResponse> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      return NextResponse.json({
        reindex_scheduler_enabled: true,
        discovery_scheduler_enabled: false,
        discovery_topics: [
          'ai', 'mcp', 'mcp-server', 'vector-db', 'llm', 'rag', 'embedding',
          'chatbot', 'agent', 'autonomous-agent', 'machine-learning'
        ],
        discovery_batch_size: 20,
        discovery_interval_hours: 24,
        discovery_min_stars: 100,
        discovery_last_pushed_days: 90,
        last_discovery_run: null,
        last_reindex_run: null,
      });
    }

    return NextResponse.json(settings);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch settings');
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

async function directPATCH(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json();
    const parsed = PatchSettingsSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsed.data;

    const settings = await prisma.appSettings.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        reindex_scheduler_enabled: body.reindex_scheduler_enabled ?? true,
        discovery_scheduler_enabled: body.discovery_scheduler_enabled ?? false,
        discovery_topics: body.discovery_topics ?? [],
        discovery_batch_size: body.discovery_batch_size ?? 20,
        discovery_interval_hours: body.discovery_interval_hours ?? 24,
        discovery_min_stars: body.discovery_min_stars ?? 100,
        discovery_last_pushed_days: body.discovery_last_pushed_days ?? 90,
      },
      update: {
        ...(body.reindex_scheduler_enabled !== undefined && { reindex_scheduler_enabled: body.reindex_scheduler_enabled }),
        ...(body.discovery_scheduler_enabled !== undefined && { discovery_scheduler_enabled: body.discovery_scheduler_enabled }),
        ...(body.discovery_topics !== undefined && { discovery_topics: body.discovery_topics }),
        ...(body.discovery_batch_size !== undefined && { discovery_batch_size: body.discovery_batch_size }),
        ...(body.discovery_interval_hours !== undefined && { discovery_interval_hours: body.discovery_interval_hours }),
        ...(body.discovery_min_stars !== undefined && { discovery_min_stars: body.discovery_min_stars }),
        ...(body.discovery_last_pushed_days !== undefined && { discovery_last_pushed_days: body.discovery_last_pushed_days }),
      },
    });

    return NextResponse.json(settings);
  } catch (err) {
    logger.error({ err }, 'Failed to update settings');
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export const GET = withProxyGet('/settings', directGET);

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (PROXY_ENABLED) {
    const body = await req.json().catch(() => null);
    const res = await proxyPatch('/settings', body);
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }
  return directPATCH(req);
}