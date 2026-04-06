'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircleIcon, Loader2Icon, ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

function DeviceContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const code = params.get('code') ?? '';
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/device${code ? `?code=${code}` : ''}`);
    }
  }, [status, router, code]);

  async function handleApprove() {
    if (!code) { setError('No device code provided.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to approve device.'); return; }
      setApproved(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center p-12"><Loader2Icon className="size-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="wordmark" size="md" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm text-center">
          {approved ? (
            <>
              <CheckCircleIcon className="mx-auto mb-4 size-12 text-emerald-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900">Device authorized!</h1>
              <p className="text-sm text-slate-500">
                You can close this tab and return to your terminal. Your MCP tool is now authenticated.
              </p>
            </>
          ) : (
            <>
              <ShieldIcon className="mx-auto mb-4 size-12 text-indigo-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900">Authorize device</h1>
              <p className="mb-2 text-sm text-slate-500">
                A device is requesting access to your ToolCairn account.
              </p>
              {code && (
                <div className="my-5 rounded-lg border-2 border-indigo-200 bg-indigo-50 py-3">
                  <p className="text-xs font-medium text-slate-400 mb-1">Device code</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-indigo-700">{code}</p>
                </div>
              )}
              <p className="mb-6 text-xs text-slate-400">
                Signed in as <span className="font-medium text-slate-600">{session?.user?.email}</span>
              </p>

              {error && <p className="mb-4 text-xs font-medium text-red-600">{error}</p>}

              <Button
                onClick={handleApprove}
                disabled={loading || !code}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? <Loader2Icon className="size-4 animate-spin" /> : 'Authorize Device'}
              </Button>
              <Link href="/explore" className="mt-4 block text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DevicePage() {
  return (
    <Suspense>
      <DeviceContent />
    </Suspense>
  );
}
