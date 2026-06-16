'use client';
import { useState, useEffect } from 'react';
import { getToken, getUser, setToken, setUser, clearToken, apiFetch } from '@/lib/auth';

export function useAuth() {
  const [user, setUserState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const cached = getUser();
    if (token && cached) {
      setUserState(cached);
      setLoading(false);
      return;
    }
    if (token) {
      apiFetch('/api/auth/me')
        .then((r) => r.ok ? r.json() : null)
        .then((u) => { if (u) { setUserState(u); setUser(u); } })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: any) => {
    setToken(token);
    setUser(userData);
    setUserState(userData);
  };

  const logout = () => {
    clearToken();
    setUserState(null);
  };

  return { user, loading, login, logout };
}
