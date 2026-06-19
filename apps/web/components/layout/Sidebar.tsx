'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutGrid, CheckSquare, GitBranch, BarChart2,
  Users, Settings, Code2, Plus, LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MANAGER_NAV = [
  { label: 'Dashboard',    href: '/dashboard',  icon: LayoutGrid },
  { label: 'Tasks',        href: '/tasks',      icon: CheckSquare },
  { label: 'Repositories', href: '/repositories', icon: GitBranch },
  { label: 'Analytics',    href: '/analytics',  icon: BarChart2 },
  { label: 'Team',         href: '/team',       icon: Users },
];

const DEV_NAV = [
  { label: 'Dashboard',    href: '/dashboard',  icon: LayoutGrid },
  { label: 'Tasks',        href: '/developer',  icon: CheckSquare },
  { label: 'Repositories', href: '/repositories', icon: GitBranch },
  { label: 'Analytics',    href: '/analytics',  icon: BarChart2 },
  { label: 'Team',         href: '/team',       icon: Users },
];

export function Sidebar({ view }: { view: 'manager' | 'developer' }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { logout } = useAuth();
  const nav = view === 'manager' ? MANAGER_NAV : DEV_NAV;

  return (
    <aside className="
      w-48 flex-shrink-0 flex flex-col
      border-r border-zinc-800 dark:border-zinc-800
      bg-zinc-950 dark:bg-zinc-950
    ">
      <div className="px-4 py-4 border-b border-zinc-800">
        <span className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
          trace
        </span>
      </div>

      <nav className="flex-1 pt-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-xs transition-colors',
                'border-l-2',
                active
                  ? 'border-zinc-300 dark:border-zinc-300 text-zinc-100 bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
              )}
            >
              <Icon size={13} strokeWidth={1.5} className={active ? 'opacity-100' : 'opacity-60'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Settings size={13} strokeWidth={1.5} className="opacity-60" />
          Settings
        </Link>
        <Link
          href={view === 'manager' ? '/developer' : '/dashboard'}
          className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Code2 size={13} strokeWidth={1.5} className="opacity-60" />
          {view === 'manager' ? 'Developer View' : 'Manager View'}
        </Link>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <LogOut size={13} strokeWidth={1.5} className="opacity-60" />
          Sign out
        </button>
        <div className="mx-3 mb-3 mt-1">
          <Link
            href="/new-project"
            className="
              block w-full py-2 text-center font-mono text-[10px] tracking-wider
              border border-zinc-700 text-zinc-300
              hover:bg-zinc-800 transition-colors
            "
          >
            + NEW PROJECT
          </Link>
        </div>
      </div>
    </aside>
  );
}