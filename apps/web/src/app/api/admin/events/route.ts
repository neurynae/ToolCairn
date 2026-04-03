import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/admin/prisma';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  toolName: z.string().optional(),
  status: z.enum(['ok', 'error']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, toolName, status, from, to } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(toolName && { tool_name: { contains: toolName } }),
    ...(status && { status }),
    ...(from || to
      ? {
          created_at: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  try {
    const [items, total] = await Promise.all([
      prisma.mcpEvent.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          tool_name: true,
          query_id: true,
          duration_ms: true,
          status: true,
          metadata: true,
          created_at: true,
        },
      }),
      prisma.mcpEvent.count({ where }),
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
