export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('trace_theme') as Theme) ?? 'dark';
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('trace_theme', theme);
  document.documentElement.classList.toggle('light', theme === 'light');
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
