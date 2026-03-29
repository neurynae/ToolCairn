import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { approveStagedNode, rejectStagedNode } from '@/lib/admin/staged-review.service';

const BodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(1) }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
