'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { apiFetch } from '@/lib/auth';
import Link from 'next/link';

interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'in_review' | 'verified' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedPoints: number;
  assignedTo?: { login: string } | null;
  project: { _id: string; name: string };
}

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pull every project, then flatten all tasks across them.
    apiFetch('/api/projects')
      .then(async (r) => {
        if (!r.ok) return [];
        const projects = await r.json();
        const detailed = await Promise.all(
          projects.map((p: any) =>
            apiFetch(`/api/projects/${p._id}`).then((r2) => (r2.ok ? r2.json() : null))
          )
        );
        const all: Task[] = [];
        detailed.forEach((p) => {
          if (!p) return;
          (p.tasks ?? []).forEach((t: any) => all.push({ ...t, project: { _id: p._id, name: p.name } }));
        });
        return all;
      })
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; TASKS</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">All Tasks</h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="border border-zinc-800 px-4 py-4">
            <p className="font-mono text-xs text-zinc-600">No tasks across any project yet.</p>
          </div>
        ) : (
          <div className="border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Points'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-mono text-[9px] text-zinc-600 tracking-widest uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-3 py-2.5 text-xs text-zinc-200">{t.title}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/projects/${t.project._id}`} className="text-xs text-zinc-500 hover:text-zinc-300 border-b border-zinc-700">
                        {t.project.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-500">
                      {t.assignedTo?.login ?? '—'}
                    </td>
                    <td className="px-3 py-2.5"><Badge variant={t.priority} /></td>
                    <td className="px-3 py-2.5"><Badge variant={t.status} /></td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-500">{t.estimatedPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}