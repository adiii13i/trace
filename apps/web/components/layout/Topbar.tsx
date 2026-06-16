'use client';
import { Bell, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface TopbarProps {
  title?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export function Topbar({ actions }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="
      flex items-center gap-3 h-10 px-4 flex-shrink-0
      border-b border-zinc-800
    ">
      {/* Nav links */}
      <nav className="flex items-center">
        {['Deployments', 'Logs', 'Network'].map((item, i) => (
          <button
            key={item}
            className={`
              font-mono text-[10px] px-3 h-10 flex items-center
              border-b-2 transition-colors
              ${i === 0
                ? 'border-zinc-300 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'}
            `}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button className="w-7 h-7 flex items-center justify-center border border-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors">
          <Mail size={11} strokeWidth={1.5} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center border border-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors">
          <Bell size={11} strokeWidth={1.5} />
        </button>
        <ThemeToggle />
        <div className="w-6 h-6 flex items-center justify-center border border-zinc-700 bg-zinc-800 font-mono text-[9px] text-zinc-400">
          {user?.login?.slice(0, 2).toUpperCase() ?? 'ME'}
        </div>
      </div>
    </header>
  );
}
