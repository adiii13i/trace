'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { apiFetch, getUser } from '@/lib/auth';
import { ArrowLeft, UserPlus, X } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'pending' | 'in_progress' | 'in_review' | 'verified' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedPoints: number;
  assignedTo?: { _id: string; login: string; email: string } | null;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  status: string;
  webhookSecret: string;
  tasks: Task[];
  team: any[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/projects/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(r.status === 404 ? 'Project not found.' : 'Failed to load project.');
          return;
        }
        setProject(await r.json());
      })
      .catch(() => setError('Network error. Is the API running?'))
      .finally(() => setLoading(false));
  }, [id]);

  const tasks = project?.tasks ?? [];
  const verifiedCount = tasks.filter((t) => t.status === 'verified').length;
  const progress = tasks.length > 0 ? Math.round((verifiedCount / tasks.length) * 100) : 0;
  const currentUser = getUser();

  async function handleAssign(taskId: string, userId: string | null) {
    try {
      const res = await apiFetch(`/api/projects/tasks/${taskId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t._id === taskId ? { ...t, ...updated } : t)),
            }
          : prev
      );
    } catch {
      // silently ignore — UI just won't update
    }
  }

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft size={11} strokeWidth={1.5} />
          BACK TO DASHBOARD
        </Link>

        {loading ? (
          <p className="font-mono text-xs text-zinc-600">Loading project...</p>
        ) : error ? (
          <div className="border border-red-900/50 px-4 py-3">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        ) : project ? (
          <>
            <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">
              MAIN &gt; DASHBOARD &gt; {project.name.toUpperCase()}
            </p>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-medium tracking-tight text-zinc-100">
                {project.name}
              </h1>
              <span className="font-mono text-[10px] text-zinc-500">{progress}%</span>
            </div>
            {project.description && (
              <p className="text-xs text-zinc-500 mb-4">{project.description}</p>
            )}
            <div className="mb-6">
              <ProgressBar value={progress} />
            </div>

            {/* Repo + webhook info */}
            <section className="mb-6">
              <p className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mb-2">
                Repository
              </p>
              <div className="border border-zinc-800 bg-zinc-900/30 px-4 py-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">
                    {project.repoOwner}/{project.repoName}
                  </span>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] text-zinc-500 hover:text-zinc-300 border-b border-zinc-700"
                  >
                    View on GitHub
                  </a>
                </div>
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
                      Webhook Secret
                    </span>
                    <button
                      onClick={() => setShowSecret((s) => !s)}
                      className="font-mono text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      {showSecret ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <code className="block font-mono text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-1.5 break-all">
                    {showSecret ? project.webhookSecret : '•'.repeat(40)}
                  </code>
                  <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed">
                    Add this as the secret when creating a push webhook on this repo,
                    pointed at <code className="text-zinc-500">/api/webhooks/github</code> on your API.
                  </p>
                </div>
              </div>
            </section>

            {/* Tasks */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
                  Tasks
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {tasks.length} TOTAL · {verifiedCount} VERIFIED
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="border border-zinc-800 px-4 py-4">
                  <p className="font-mono text-xs text-zinc-600">No tasks generated yet.</p>
                </div>
              ) : (
                <div>
                  {tasks.map((task) => (
                    <div key={task._id}>
                      <div
                        onClick={() =>
                          setExpandedTaskId((p) => (p === task._id ? null : task._id))
                        }
                        className="flex items-center gap-2.5 px-3 py-2.5 border border-zinc-800 mb-px cursor-pointer hover:border-zinc-700 transition-colors"
                      >
                        <span className="font-mono text-[10px] text-zinc-600 w-2 flex-shrink-0">
                          {expandedTaskId === task._id ? '▾' : '›'}
                        </span>
                        <span className="flex-1 text-xs text-zinc-200 truncate">
                          {task.title}
                        </span>
                        {task.assignedTo ? (
                          <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 flex-shrink-0">
                            {task.assignedTo.login}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssign(task._id, null);
                              }}
                              title="Unassign"
                              className="text-zinc-700 hover:text-red-400 transition-colors"
                            >
                              <X size={10} strokeWidth={2} />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentUser?.id) handleAssign(task._id, currentUser.id);
                            }}
                            className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 hover:text-zinc-200 border border-zinc-700 px-1.5 py-0.5 flex-shrink-0 transition-colors"
                          >
                            <UserPlus size={9} strokeWidth={1.5} />
                            ASSIGN TO ME
                          </button>
                        )}
                        <Badge variant={task.priority} />
                        <Badge variant={task.status} />
                      </div>

                      {expandedTaskId === task._id && (
                        <div className="border border-zinc-800 border-t-0 px-4 py-3 mb-px bg-zinc-900/20">
                          <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                            {task.description}
                          </p>
                          {task.acceptanceCriteria?.length > 0 && (
                            <div className="mb-3">
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
                          <span className="font-mono text-[9px] text-zinc-700">
                            {task.estimatedPoints} pts estimated
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
