'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { apiFetch } from '@/lib/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  status: string;
  tasks: any[];
}

interface TeamMember {
  _id: string;
  login: string;
  email: string;
  avatarUrl: string;
  activeTask?: string;
  latestCommit?: string;
  status: 'in_progress' | 'blocked' | 'review' | 'pending';
}

function calcProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'verified').length;
  return Math.round((done / tasks.length) * 100);
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/projects').then((r) => r.ok ? r.json() : []),
      // Team endpoint (returns all team members across projects)
      apiFetch('/api/projects').then(async (r) => {
        if (!r.ok) return [];
        const projs = await r.json();
        const allMembers: TeamMember[] = [];
        for (const p of projs) {
          (p.team ?? []).forEach((m: any) => {
            if (!allMembers.find((x) => x._id === m._id)) {
              allMembers.push({ ...m, status: 'pending' });
            }
          });
        }
        return allMembers;
      }),
    ]).then(([projs, team]) => {
      setProjects(projs);
      setMembers(team);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar
        actions={
          <Link
            href="/new-project"
            className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-100 text-zinc-900 font-mono text-[10px] hover:bg-white transition-colors"
          >
            <Plus size={10} />
            Execute Task
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">
          MAIN &gt; DASHBOARD
        </p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">
          Workspace Overview
        </h1>

        {/* Active Projects */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
              Active Projects
            </span>
            <span className="font-mono text-[10px] text-green-400">
              &#9632; {projects.filter((p) => p.status === 'active').length} Running
            </span>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50">
            {loading ? (
              <div className="px-4 py-6 text-xs text-zinc-600 font-mono">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-6 text-xs text-zinc-600 font-mono">
                No projects yet.{' '}
                <Link href="/new-project" className="text-zinc-400 underline">Create one</Link>
              </div>
            ) : (
              projects.map((project, i) => {
                const pct = calcProgress(project.tasks);
                return (
                  <div
                    key={project._id}
                    className={`px-4 py-3 ${i < projects.length - 1 ? 'border-b border-zinc-800' : ''}`}
                  >
                    <div className="flex items-baseline justify-between mb-1.5">
                      <Link
                        href={`/projects/${project._id}`}
                        className="text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className="font-mono text-[10px] text-zinc-500">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Team Performance */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
              Team Performance
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              <span className="text-green-400">&#9632;</span> {members.length} Online
            </span>
          </div>
          <div className="border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Operator', 'Status', 'Active Task', 'Latest Commit', 'Pulse'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-mono text-[9px] text-zinc-600 tracking-widest uppercase font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-xs text-zinc-600 font-mono">
                      No team members assigned to projects.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m._id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-[8px] text-zinc-400">
                            {m.login.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs text-zinc-200">{m.login}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={m.status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-zinc-500">
                        {m.activeTask ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-600">
                        {m.latestCommit ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-px items-end h-3.5">
                          {[6, 10, 7, 12, 8, 11, 9].map((h, i) => (
                            <div key={i} className="w-0.5 bg-zinc-700" style={{ height: h }} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
