'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';

interface Member {
  _id: string;
  login: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/projects')
      .then(async (r) => (r.ok ? r.json() : []))
      .then((projects) => {
        const seen = new Map<string, Member>();
        projects.forEach((p: any) => {
          (p.team ?? []).forEach((m: any) => seen.set(m._id, m));
          if (p.createdBy?._id) seen.set(p.createdBy._id, { ...p.createdBy, role: 'manager' });
        });
        setMembers(Array.from(seen.values()));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; TEAM</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">Team</h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : members.length === 0 ? (
          <div className="border border-zinc-800 px-4 py-4">
            <p className="font-mono text-xs text-zinc-600">
              No team members yet. Team membership is added when creating a project.
            </p>
          </div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {members.map((m) => (
              <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-[9px] text-zinc-400 flex-shrink-0">
                  {m.login?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-200">{m.login}</p>
                  <p className="text-[11px] text-zinc-500">{m.email}</p>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 border border-zinc-700 px-1.5 py-0.5 uppercase">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}