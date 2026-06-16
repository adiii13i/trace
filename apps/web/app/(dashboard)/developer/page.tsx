'use client';
import { useState, useEffect, useCallback } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { apiFetch } from '@/lib/auth';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

type TaskStatus   = 'pending' | 'in_progress' | 'in_review' | 'verified' | 'blocked';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPoints: number;
  project: { name: string; repoName: string };
  acceptanceCriteria: string[];
}

interface Metrics {
  buildSha: string;
  buildAge: string;
  latency: string;
  region: string;
  points: number;
}

export default function DeveloperPage() {
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [metrics,     setMetrics]     = useState<Metrics | null>(null);
  const [cmdValue,    setCmdValue]    = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [utcTime,     setUtcTime]     = useState('');
  const [loading,     setLoading]     = useState(true);

  // Live UTC clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setUtcTime(
        [n.getUTCHours(), n.getUTCMinutes(), n.getUTCSeconds()]
          .map((v) => String(v).padStart(2, '0'))
          .join(':')
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch tasks + metrics
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, mr] = await Promise.all([
        apiFetch('/api/tasks/mine'),
        apiFetch('/api/tasks/metrics/me'),
      ]);
      if (tr.ok) setTasks(await tr.json());
      if (mr.ok) setMetrics(await mr.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // CMD+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('cmd-input')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCmd = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !cmdValue.trim()) return;
    const val = cmdValue.trim().toLowerCase();
    if (val === 'refresh') await loadData();
    else if (val === 'clear') setCmdValue('');
    setCmdValue('');
  }, [cmdValue, loadData]);

  const displayed = cmdValue.startsWith('/')
    ? tasks.filter((t) => t.title.toLowerCase().includes(cmdValue.slice(1).toLowerCase()))
    : tasks;

  return (
    <>
      <Topbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Command bar */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2">
            <span className="font-mono text-xs text-zinc-600">&rsaquo;</span>
            <input
              id="cmd-input"
              type="text"
              value={cmdValue}
              onChange={(e) => setCmdValue(e.target.value)}
              onKeyDown={handleCmd}
              placeholder="Execute command or search tasks..."
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent outline-none font-mono text-xs text-zinc-100 placeholder:text-zinc-700"
            />
            <kbd className="font-mono text-[9px] text-zinc-700 border border-zinc-800 px-1">CMD</kbd>
            <kbd className="font-mono text-[9px] text-zinc-700 border border-zinc-800 px-1">K</kbd>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Tasks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
                Active Assigned Tasks
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {loading ? '—' : `${displayed.length} TOTAL`}
              </span>
            </div>

            {loading ? (
              <div className="border border-zinc-800 px-3 py-3">
                <span className="font-mono text-xs text-zinc-700 animate-pulse">Fetching tasks...</span>
              </div>
            ) : displayed.length === 0 ? (
              <div className="border border-zinc-800 px-3 py-3">
                <span className="font-mono text-xs text-zinc-700">
                  No active tasks. Type <code className="text-zinc-500">refresh</code> to sync.
                </span>
              </div>
            ) : (
              <div>
                {displayed.map((task) => (
                  <div key={task._id}>
                    <div
                      onClick={() => setExpandedId((p) => (p === task._id ? null : task._id))}
                      className={clsx(
                        'flex items-center gap-2.5 px-3 py-2.5 border border-zinc-800 mb-px cursor-pointer',
                        'hover:border-zinc-700 transition-colors',
                        expandedId === task._id && 'border-zinc-700 bg-zinc-900/30'
                      )}
                    >
                      <span className="font-mono text-[10px] text-zinc-600 w-2 flex-shrink-0">
                        {expandedId === task._id ? '▾' : '›'}
                      </span>
                      <span className="flex-1 text-xs text-zinc-200 truncate">{task.title}</span>
                      <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">
                        #{task._id.slice(-6).toUpperCase()}
                      </span>
                      <Badge variant={task.priority} />
                    </div>

                    {expandedId === task._id && (
                      <div className="border border-zinc-800 border-t-0 px-4 py-3 mb-px bg-zinc-900/20">
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                          {task.description}
                        </p>
                        {task.acceptanceCriteria?.length > 0 && (
                          <div>
                            <p className="font-mono text-[9px] text-zinc-600 mb-1.5 tracking-wider uppercase">
                              Acceptance Criteria
                            </p>
                            <ul className="space-y-1">
                              {task.acceptanceCriteria.map((c, i) => (
                                <li key={i} className="flex gap-2 text-xs text-zinc-500">
                                  <span className="font-mono text-zinc-700">{i + 1}.</span>
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-3 mt-3">
                          <span className="font-mono text-[9px] text-zinc-700">
                            {task.estimatedPoints} pts · {task.project?.repoName ?? '—'}
                          </span>
                          <Badge variant={task.status} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-px bg-zinc-800">
            <MetricCard
              label="Build Status"
              value={metrics?.buildSha ?? '—'}
              sub={metrics?.buildAge ?? '—'}
              icon={<CheckCircle size={11} strokeWidth={1.5} />}
            />
            <MetricCard
              label="Latency (P99)"
              value={metrics?.latency ?? '—'}
              sub={metrics?.region ?? '—'}
              icon={<Clock size={11} strokeWidth={1.5} />}
            />
            <MetricCard
              label="Contributions"
              value={metrics ? metrics.points.toLocaleString() : '—'}
              sub="Points this sprint"
              icon={<TrendingUp size={11} strokeWidth={1.5} />}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2 border-t border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            SYSTEM_READY
          </div>
          <span className="font-mono text-[10px] text-zinc-700">
            UTC: {utcTime}
          </span>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, sub, icon }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">{label}</span>
        <span className="text-zinc-700">{icon}</span>
      </div>
      <div className="font-mono text-sm font-medium text-zinc-100">{value}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
    </div>
  );
}
