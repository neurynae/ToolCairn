import { MemgraphToolRepository } from '@toolpilot/graph';
import { type NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import { withProxyGet } from '@/lib/api/proxy';

const logger = pino({ name: '@toolpilot/public:api-tool-names' });

/** Normalize a name for fuzzy matching — strip dots, hyphens, spaces */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_]/g, '');
}

// Lazy-init repo — only used in directHandler (local dev, no TOOLPILOT_API_URL).
let _repo: MemgraphToolRepository | null = null;
function getRepo() {
  if (!_repo) _repo = new MemgraphToolRepository();
  return _repo;
}

async function directHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';

    const result = await getRepo().getAllToolNames();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: 'graph_error' }, { status: 500 });
    }

    let names: string[];
    if (!q) {
      names = result.data.slice(0, 20);
    } else {
      const qLower = q.toLowerCase();
      const qNorm = normalize(q);

      const exactPrefix = result.data.filter((n) => n.toLowerCase().startsWith(qLower));
      const substring = result.data.filter(
        (n) => !n.toLowerCase().startsWith(qLower) && n.toLowerCase().includes(qLower),
      );
      const fuzzy = result.data.filter((n) => {
        const nNorm = normalize(n);
        return (
          !n.toLowerCase().includes(qLower) &&
          (nNorm.startsWith(qNorm) ||
            nNorm.includes(qNorm) ||
            qNorm.startsWith(nNorm.slice(0, Math.max(nNorm.length - 2, 2))))
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

export const GET = withProxyGet('/data/tools/names', directHandler);
