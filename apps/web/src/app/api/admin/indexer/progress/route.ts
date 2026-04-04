import { NextResponse } from 'next/server';
import { withProxyGet } from '@/lib/admin/api-proxy';

async function directGET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, data: { progress: null } });
}

export const GET = withProxyGet('/indexer/progress', directGET);
