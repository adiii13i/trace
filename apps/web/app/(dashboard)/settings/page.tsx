'use client';
import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout }    = useAuth();
  const router              = useRouter();
  const [notifs, setNotifs] = useState({ verification: true, blocked: true, deployment: false });
  const [density, setDensity] = useState<'compact' | 'normal'>('compact');

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; SETTINGS</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">Settings</h1>

        {/* Appearance */}
        <Section label="Appearance">
          <SettingRow
            title="Theme"
            description="Switch between dark and light interface"
          >
            <div className="flex gap-px">
              <ToggleBtn active={theme === 'dark'} onClick={() => setTheme('dark')}>DARK</ToggleBtn>
              <ToggleBtn active={theme === 'light'} onClick={() => setTheme('light')}>LIGHT</ToggleBtn>
            </div>
          </SettingRow>

          <SettingRow
            title="Density"
            description="Compact view reduces row padding in tables"
          >
            <div className="flex gap-px">
              <ToggleBtn active={density === 'compact'} onClick={() => setDensity('compact')}>COMPACT</ToggleBtn>
              <ToggleBtn active={density === 'normal'} onClick={() => setDensity('normal')}>NORMAL</ToggleBtn>
            </div>
          </SettingRow>

          <SettingRow title="Typeface" description="Monospace used for all technical data" last>
            <span className="font-mono text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1">
              IBM Plex Mono
            </span>
          </SettingRow>
        </Section>

        {/* Account */}
        <Section label="Account">
          <SettingRow title="Signed in as" description={user?.email ?? '—'}>
            <span className="font-mono text-[10px] text-zinc-400 border border-zinc-800 px-2 py-1">
              {user?.role?.toUpperCase() ?? '—'}
            </span>
          </SettingRow>

          <SettingRow
            title="GitHub Connection"
            description={user?.githubId ? `Connected as @${user.login}` : 'Not connected'}
            descriptionColor={user?.githubId ? 'text-green-400' : 'text-zinc-500'}
          >
            <ActionBtn>
              {user?.githubId ? 'Disconnect' : 'Connect'}
            </ActionBtn>
          </SettingRow>

          <SettingRow
            title="Webhook Secret"
            description="Used to verify push events from GitHub"
            last
          >
            <ActionBtn>Regenerate</ActionBtn>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section label="Notifications">
          <SettingRow title="Task verification alerts" description="Notified when the LLM verifies your commit">
            <Switch
              on={notifs.verification}
              onChange={(v) => setNotifs((p) => ({ ...p, verification: v }))}
            />
          </SettingRow>
          <SettingRow title="Blocked team member alerts" description="Notified when a teammate is blocked">
            <Switch
              on={notifs.blocked}
              onChange={(v) => setNotifs((p) => ({ ...p, blocked: v }))}
            />
          </SettingRow>
          <SettingRow title="Deployment status changes" description="Notified on build pass or fail" last>
            <Switch
              on={notifs.deployment}
              onChange={(v) => setNotifs((p) => ({ ...p, deployment: v }))}
            />
          </SettingRow>
        </Section>

        {/* Danger */}
        <Section label="Session">
          <SettingRow title="Sign out" description="End this session on all devices" last>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 font-mono text-[10px] border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Sign out
            </button>
          </SettingRow>
        </Section>
      </main>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mb-2">{label}</p>
      <div className="border border-zinc-800 bg-zinc-900/30 px-4 divide-y divide-zinc-800">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ title, description, descriptionColor, children, last }: {
  title: string; description?: string;
  descriptionColor?: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${last ? '' : ''}`}>
      <div>
        <p className="text-xs font-medium text-zinc-200">{title}</p>
        {description && (
          <p className={`text-[11px] mt-0.5 ${descriptionColor ?? 'text-zinc-500'}`}>{description}</p>
        )}
      </div>
      {children && <div className="ml-4 flex-shrink-0">{children}</div>}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 font-mono text-[10px] border border-zinc-700 transition-colors
        ${active ? 'bg-zinc-100 text-zinc-900' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}
      `}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-3 py-1 font-mono text-[10px] border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
      {children}
    </button>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`
        relative w-9 h-5 flex items-center px-0.5 transition-colors border
        ${on ? 'bg-zinc-300 border-zinc-300' : 'bg-transparent border-zinc-700'}
      `}
    >
      <span
        className={`
          w-3.5 h-3.5 transition-transform duration-150
          ${on ? 'bg-zinc-900 translate-x-4' : 'bg-zinc-600 translate-x-0'}
        `}
      />
    </button>
  );
}
