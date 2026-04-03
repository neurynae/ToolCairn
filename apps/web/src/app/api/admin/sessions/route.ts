import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/admin/prisma';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
});

async function directGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, status } = parsed.data;
  const where = status ? { status } : {};

  try {
    const [items, total] = await Promise.all([
      prisma.searchSession.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          query: true,
          status: true,
          stage: true,
          created_at: true,
          updated_at: true,
          expires_at: true,
        },
      }),
      prisma.searchSession.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = withProxyGet('/sessions', directGET);
