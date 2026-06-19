'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  status: string;
}

export default function RepositoriesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/projects')
      .then(async (r) => (r.ok ? r.json() : []))
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; REPOSITORIES</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">Repositories</h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="border border-zinc-800 px-4 py-4">
            <p className="font-mono text-xs text-zinc-600">No repositories connected yet.</p>
          </div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {projects.map((p) => (
              <Link
                key={p._id}
                href={`/projects/${p._id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors"
              >
                <div>
                  <p className="text-xs text-zinc-200">{p.repoOwner}/{p.repoName}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{p.name}</p>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 border border-zinc-700 px-1.5 py-0.5 uppercase">
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}