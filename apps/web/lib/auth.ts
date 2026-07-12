const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trace_token');
}

export function setToken(token: string): void {
  localStorage.setItem('trace_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('trace_token');
  localStorage.removeItem('trace_user');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('trace_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setUser(user: any): void {
  localStorage.setItem('trace_user', JSON.stringify(user));
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

export async function loginWithGoogle(code: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Google login failed');
  return res.json();
}

export async function loginWithGithub(code: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_URL}/api/auth/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('GitHub login failed');
  return res.json();
}
