import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { approveStagedNode, rejectStagedNode } from '@/lib/admin/staged-review.service';
import { PROXY_ENABLED, proxyPatch } from '@/lib/admin/api-proxy';

const BodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(1) }),
]);

async function directPATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { params } = ctx;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Use a placeholder reviewer — a real implementation would read from the JWT payload
  const reviewedBy = 'admin';

  try {
    if (parsed.data.action === 'approve') {
      const result = await approveStagedNode(id, reviewedBy);
      return NextResponse.json({ ok: true, data: result });
    } else {
      const result = await rejectStagedNode(id, reviewedBy, parsed.data.reason);
      return NextResponse.json({ ok: true, data: result });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : message.includes('already reviewed') ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (PROXY_ENABLED) {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const res = await proxyPatch(`/review/nodes/${id}`, body);
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }
  return directPATCH(request, ctx);
}
