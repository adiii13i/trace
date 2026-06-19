'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';
import { CheckCircle2, XCircle } from 'lucide-react';

interface LogEntry {
  taskId: string;
  taskTitle: string;
  projectName: string;
  commitSha: string;
  commitMessage: string;
  llmVerdict: boolean;
  llmReasoning: string;
  attemptedAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/tasks/logs')
      .then(async (r) => (r.ok ? r.json() : []))
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; LOGS</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">
          Verification Logs
        </h1>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading...</p>
        ) : logs.length === 0 ? (
          <div className="border border-zinc-800 px-4 py-4">
            <p className="font-mono text-xs text-zinc-600">
              No verification attempts yet. Logs appear here once a GitHub webhook
              triggers an LLM check against a pushed commit.
            </p>
          </div>
        ) : (
          <div className="space-y-px">
            {logs.map((log, i) => (
              <div key={`${log.taskId}-${i}`} className="border border-zinc-800 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  {log.llmVerdict ? (
                    <CheckCircle2 size={13} strokeWidth={1.5} className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={13} strokeWidth={1.5} className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-200">{log.taskTitle}</span>
                      <span className="font-mono text-[9px] text-zinc-600 flex-shrink-0">
                        {new Date(log.attemptedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-zinc-600 mb-1.5">
                      {log.projectName} · commit {log.commitSha?.slice(0, 7)} · "{log.commitMessage}"
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{log.llmReasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}