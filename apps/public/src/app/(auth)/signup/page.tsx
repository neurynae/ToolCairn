'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GithubIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/explore';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }

    // Auto-sign in after successful registration
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Account created but sign-in failed. Please go to the login page.');
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mb-8 text-sm text-slate-500">
        Already have one?{' '}
        <Link href={`/login${callbackUrl !== '/explore' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>

      {/* OAuth */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={!!oauthLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {oauthLoading === 'google' ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={!!oauthLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {oauthLoading === 'github' ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <GithubIcon className="size-4" />
          )}
          Continue with GitHub
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-slate-700">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-10 border-slate-200 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-10 border-slate-200 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-slate-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="h-10 border-slate-200 text-sm"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-10 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {loading ? <Loader2Icon className="size-4 animate-spin" /> : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[10px] text-slate-400">
        By signing up you agree to our open-source terms. No spam, ever.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.88z"
        fill="#4285F4"
      />
      <path
        d="M8 16c2.16 0 3.97-.71 5.3-1.94l-2.58-2c-.72.48-1.63.76-2.72.76-2.1 0-3.87-1.41-4.5-3.31H.84v2.07A8 8 0 0 0 8 16z"
        fill="#34A853"
      />
      <path
        d="M3.5 9.51A4.8 4.8 0 0 1 3.25 8c0-.52.09-1.03.25-1.51V4.42H.84A8 8 0 0 0 0 8c0 1.29.31 2.51.84 3.58l2.66-2.07z"
        fill="#FBBC05"
      />
      <path
        d="M8 3.18c1.18 0 2.24.41 3.07 1.2l2.3-2.3A8 8 0 0 0 .84 4.42L3.5 6.49C4.13 4.59 5.9 3.18 8 3.18z"
        fill="#EA4335"
      />
    </svg>
  );
}
