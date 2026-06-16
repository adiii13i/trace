'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { applyTheme, getTheme } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? '';
  const GH_OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,user:email`;

  useEffect(() => {
    applyTheme(getTheme());
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleEmailLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setTimeout(() => {
      setError('Email login is not yet configured. Please use GitHub OAuth.');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-12">
          <span className="font-mono text-xl font-semibold tracking-tight text-zinc-100">
            trace<span className="text-zinc-700">.</span>
          </span>
        </div>

        <h2 className="text-sm font-medium text-zinc-200 mb-1">Sign in to your workspace</h2>
        <p className="text-xs text-zinc-500 mb-8 leading-relaxed">
          Proof-of-work project management for engineering teams.
        </p>

        <a href={GH_OAUTH_URL} className="flex items-center gap-2.5 w-full px-3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs hover:bg-zinc-800 hover:border-zinc-600 transition-colors mb-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </a>

        <button className="flex items-center gap-2.5 w-full px-3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs hover:bg-zinc-800 hover:border-zinc-600 transition-colors mb-5">
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="font-mono text-[10px] text-zinc-700">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="space-y-2 mb-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="work@company.com" className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-zinc-600 transition-colors" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()} placeholder="Password" className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-zinc-600 transition-colors" />
        </div>

        {error && <p className="mb-3 font-mono text-[10px] text-red-400">{error}</p>}

        <button onClick={handleEmailLogin} disabled={loading} className="w-full py-2.5 bg-zinc-100 text-zinc-900 text-xs font-medium hover:bg-white transition-colors disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="mt-6 text-[11px] text-zinc-600 leading-relaxed">
          No account? <a href="#" className="text-zinc-500 border-b border-zinc-700">Request access</a>
          {' · '}
          <a href="#" className="text-zinc-500 border-b border-zinc-700">Forgot password</a>
        </p>
      </div>
    </div>
  );
}
