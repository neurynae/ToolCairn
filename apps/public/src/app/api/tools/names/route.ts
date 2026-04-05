import { MemgraphToolRepository } from '@toolpilot/graph';
import { NextResponse } from 'next/server';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/public:api-tool-names' });
const graphRepo = new MemgraphToolRepository();

/** Normalize a name for fuzzy matching — strip dots, hyphens, spaces */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_]/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    const result = await graphRepo.getAllToolNames();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: 'graph_error' }, { status: 500 });
    }

    let names: string[];
    if (!q) {
      names = result.data.slice(0, 20);
    } else {
      const qLower = q.toLowerCase();
      const qNorm = normalize(q);

      // 1st pass — exact prefix match (highest priority)
      const exactPrefix = result.data.filter((n) => n.toLowerCase().startsWith(qLower));
      // 2nd pass — substring match
      const substring = result.data.filter(
        (n) => !n.toLowerCase().startsWith(qLower) && n.toLowerCase().includes(qLower),
      );
      // 3rd pass — normalized fuzzy match (catches "nextjs" → "next.js")
      const fuzzy = result.data.filter((n) => {
        const nNorm = normalize(n);
        return (
          !n.toLowerCase().includes(qLower) &&
          (nNorm.startsWith(qNorm) || nNorm.includes(qNorm) || qNorm.startsWith(nNorm.slice(0, Math.max(nNorm.length - 2, 2))))
        );
      });

      names = [...exactPrefix, ...substring, ...fuzzy].slice(0, 10);
    }

    return NextResponse.json({ ok: true, data: names }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (e) {
    logger.error({ err: e }, 'tool names fetch failed');
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
