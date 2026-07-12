'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithGoogle } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { login }    = useAuth();

  useEffect(() => {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/login?error=google_cancelled');
      return;
    }

    loginWithGoogle(code)
      .then(function (data) {
        login(data.token, data.user);
        router.replace('/dashboard');
      })
      .catch(function () {
        router.replace('/login?error=google_failed');
      });
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="font-mono text-xs text-zinc-600 animate-pulse">
        Authenticating with Google...
      </p>
    </div>
  );
}