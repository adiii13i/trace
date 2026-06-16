'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="
        w-7 h-7 flex items-center justify-center
        border border-zinc-700 dark:border-zinc-700
        text-zinc-400 hover:text-zinc-100
        light:border-zinc-300 light:text-zinc-500 light:hover:text-zinc-900
        transition-colors
      "
    >
      {theme === 'dark'
        ? <Sun size={13} strokeWidth={1.5} />
        : <Moon size={13} strokeWidth={1.5} />
      }
    </button>
  );
}
