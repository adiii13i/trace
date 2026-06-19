'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  repoOwner: string;
  repoName: string;
  status: string;
}

export default function NetworkPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; NETWORK</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">
          Webhook Endpoints
        </h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="border border-zinc-800 px-4 py-4">
            <p className="font-mono text-xs text-zinc-600">No projects configured yet.</p>
          </div>
        ) : (
          <div className="space-y-px">
            {projects.map((p) => (
              <div key={p._id} className="border border-zinc-800 px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/projects/${p._id}`}
                    className="text-xs text-zinc-200 hover:text-white transition-colors"
                  >
                    {p.name}
                  </Link>
                  <span className="font-mono text-[9px] text-zinc-500 border border-zinc-700 px-1.5 py-0.5 uppercase">
                    {p.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <Row label="Repository" value={`${p.repoOwner}/${p.repoName}`} />
                  <Row label="Webhook URL" value={`${apiUrl}/api/webhooks/github`} mono />
                  <Row label="Events" value="push" mono />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="font-mono text-[10px] text-zinc-600 mt-6 leading-relaxed">
          Configure these as a push webhook on each repository in GitHub's repo
          settings, using the webhook secret shown on the project's detail page.
        </p>
      </main>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] text-zinc-600 tracking-wider uppercase">{label}</span>
      <span className={`text-[11px] text-zinc-500 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}