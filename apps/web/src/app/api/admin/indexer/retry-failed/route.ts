import { NextResponse, type NextRequest } from 'next/server';
import { enqueueIndexJob } from '@toolpilot/queue';
import { prisma } from '@/lib/admin/prisma';
import { withProxyPost } from '@/lib/admin/api-proxy';

async function directPOST(_request: NextRequest): Promise<NextResponse> {
  try {
    const failedTools = await prisma.indexedTool.findMany({
      where: { index_status: 'failed' },
      select: { github_url: true },
      take: 100,
    });

    let enqueued = 0;
    for (const tool of failedTools) {
      await enqueueIndexJob(tool.github_url, 5);
      enqueued++;
    }

    await prisma.indexedTool.updateMany({
      where: { index_status: 'failed' },
      data: { index_status: 'pending' },
    });

    return NextResponse.json({
      ok: true,
      message: `${enqueued} failed tools re-enqueued for indexing`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = withProxyPost('/indexer/retry-failed', directPOST);
