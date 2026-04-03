import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getMetrics } from '@/lib/admin/metrics.service';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

async function directGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse({ days: searchParams.get('days') ?? 30 });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = await getMetrics(parsed.data.days);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = withProxyGet('/metrics', directGET);
