'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithGithub } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

export default function GithubCallbackPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { login }    = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) { router.replace('/login'); return; }
    loginWithGithub(code)
      .then(({ token, user }) => { login(token, user); router.replace('/dashboard'); })
      .catch(() => router.replace('/login?error=oauth_failed'));
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="font-mono text-xs text-zinc-600 animate-pulse">Authenticating with GitHub...</p>
    </div>
  );
}
