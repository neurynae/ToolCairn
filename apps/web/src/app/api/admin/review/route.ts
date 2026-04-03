import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { listPendingReview } from '@/lib/admin/staged-review.service';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

async function directGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse({
    page: searchParams.get('page') ?? 1,
    pageSize: searchParams.get('pageSize') ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await listPendingReview(parsed.data.page, parsed.data.pageSize);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = withProxyGet('/review/nodes', directGET);
