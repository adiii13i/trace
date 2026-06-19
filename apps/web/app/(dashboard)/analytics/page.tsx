'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ totalTasks: 0, verified: 0, points: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/projects')
      .then(async (r) => (r.ok ? r.json() : []))
      .then(async (projects) => {
        const detailed = await Promise.all(
          projects.map((p: any) => apiFetch(`/api/projects/${p._id}`).then((r) => (r.ok ? r.json() : null)))
        );
        let totalTasks = 0, verified = 0, points = 0;
        detailed.forEach((p) => {
          if (!p) return;
          (p.tasks ?? []).forEach((t: any) => {
            totalTasks++;
            if (t.status === 'verified') verified++;
            points += t.earnedPoints ?? 0;
          });
        });
        setStats({ totalTasks, verified, points, projects: projects.length });
      })
      .finally(() => setLoading(false));
  }, []);

  const verifyRate = stats.totalTasks > 0 ? Math.round((stats.verified / stats.totalTasks) * 100) : 0;

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; ANALYTICS</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">Analytics</h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : (
          <div className="grid grid-cols-4 gap-px bg-zinc-800">
            <StatCard label="Projects" value={stats.projects} />
            <StatCard label="Total Tasks" value={stats.totalTasks} />
            <StatCard label="Verify Rate" value={`${verifyRate}%`} />
            <StatCard label="Points Earned" value={stats.points} />
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-950 px-4 py-4">
      <p className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mb-2">{label}</p>
      <p className="font-mono text-lg text-zinc-100">{value}</p>
    </div>
  );
}