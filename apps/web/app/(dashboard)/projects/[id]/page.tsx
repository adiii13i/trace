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
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamError, setTeamError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch('/api/projects/' + id)
      .then(function (r) {
        if (!r.ok) {
          setError(r.status === 404 ? 'Project not found.' : 'Failed to load project.');
          return null;
        }
        return r.json();
      })
      .then(function (data) {
        if (data) setProject(data);
      })
      .catch(function () {
        setError('Network error. Is the API running?');
      })
      .finally(function () {
        setLoading(false);
      });
  }, [id]);

  const tasks = project ? project.tasks : [];
  const verifiedCount = tasks.filter(function (t) { return t.status === 'verified'; }).length;
  const progress = tasks.length > 0 ? Math.round((verifiedCount / tasks.length) * 100) : 0;
  const currentUser = getUser();

  function handleAssign(taskId: string, userId: string | null) {
    apiFetch('/api/projects/tasks/' + taskId + '/assign', {
      method: 'PATCH',
      body: JSON.stringify({ userId: userId }),
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (updated) {
        if (!updated) return;
        setProject(function (prev) {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map(function (t) {
              return t._id === taskId ? { ...t, ...updated } : t;
            }),
          };
        });
      })
      .catch(function () {});
  }

  function handleAddTeamMember() {
    if (!teamEmail.trim() || !project) return;
    setTeamError('');
    setAddingMember(true);
    apiFetch('/api/projects/' + project._id + '/team', {
      method: 'POST',
      body: JSON.stringify({ email: teamEmail.trim() }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          setTeamError(result.data.error || 'Failed to add member');
          return;
        }
        setProject(function (prev) {
          return prev ? { ...prev, team: result.data.team } : prev;
        });
        setTeamEmail('');
      })
      .catch(function () {
        setTeamError('Network error');
      })
      .finally(function () {
        setAddingMember(false);
      });
  }

  function handleRemoveTeamMember(userId: string) {
    if (!project) return;
    apiFetch('/api/projects/' + project._id + '/team/' + userId, { method: 'DELETE' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        setProject(function (prev) {
          return prev ? { ...prev, team: data.team } : prev;
        });
      })
      .catch(function () {});
  }

  return (
    <div>
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
              <h1 className="text-lg font-medium tracking-tight text-zinc-100">{project.name}</h1>
              <span className="font-mono text-[10px] text-zinc-500">{progress}%</span>
            </div>
            {project.description ? (
              <p className="text-xs text-zinc-500 mb-4">{project.description}</p>
            ) : null}
            <div className="mb-6">
              <ProgressBar value={progress} />
            </div>

            <section className="mb-6">
              <p className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mb-2">Repository</p>
              <div className="border border-zinc-800 bg-zinc-900/30 px-4 py-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{project.repoOwner}/{project.repoName}</span>
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
                      onClick={function () { setShowSecret(!showSecret); }}
                      className="font-mono text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      {showSecret ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <code className="block font-mono text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-1.5 break-all">
                    {showSecret ? project.webhookSecret : '••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed">
                    Add this as the secret when creating a push webhook on this repo,
                    pointed at <code className="text-zinc-500">/api/webhooks/github</code> on your API.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <p className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mb-2">Team</p>
              <div className="border border-zinc-800 bg-zinc-900/30 px-4 py-3.5">
                {project.team.length === 0 ? (
                  <p className="font-mono text-xs text-zinc-600 mb-3">No team members yet.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {project.team.map(function (m: any) {
                      return (
                        <div key={m._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-[8px] text-zinc-400">
                              {m.login ? m.login.slice(0, 2).toUpperCase() : ''}
                            </div>
                            <span className="text-xs text-zinc-300">{m.login}</span>
                            <span className="text-[11px] text-zinc-600">{m.email}</span>
                          </div>
                          <button
                            onClick={function () { handleRemoveTeamMember(m._id); }}
                            className="text-zinc-700 hover:text-red-400 transition-colors"
                            title="Remove from team"
                          >
                            <X size={12} strokeWidth={2} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 pt-3 border-t border-zinc-800">
                  <input
                    type="email"
                    value={teamEmail}
                    onChange={function (e) { setTeamEmail(e.target.value); }}
                    onKeyDown={function (e) { if (e.key === 'Enter') handleAddTeamMember(); }}
                    placeholder="teammate@email.com"
                    className="flex-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-600 placeholder:text-zinc-700"
                  />
                  <button
                    onClick={handleAddTeamMember}
                    disabled={addingMember}
                    className="px-3 py-1.5 font-mono text-[10px] border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {addingMember ? 'ADDING...' : 'ADD MEMBER'}
                  </button>
                </div>
                {teamError ? (
                  <p className="font-mono text-[10px] text-red-400 mt-2">{teamError}</p>
                ) : null}
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
                  The person must have signed into trace at least once via GitHub before they can be added.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase">Tasks</span>
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
                  {tasks.map(function (task) {
                    return (
                      <div key={task._id}>
                        <div
                          onClick={function () {
                            setExpandedId(expandedId === task._id ? null : task._id);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2.5 border border-zinc-800 mb-px cursor-pointer hover:border-zinc-700 transition-colors"
                        >
                          <span className="font-mono text-[10px] text-zinc-600 w-2 flex-shrink-0">
                            {expandedId === task._id ? '▾' : '›'}
                          </span>
                          <span className="flex-1 text-xs text-zinc-200 truncate">{task.title}</span>
                          {task.assignedTo ? (
                            <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 flex-shrink-0">
                              {task.assignedTo.login}
                              <button
                                onClick={function (e) {
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
                              onClick={function (e) {
                                e.stopPropagation();
                                if (currentUser && currentUser.id) handleAssign(task._id, currentUser.id);
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
                        {expandedId === task._id ? (
                          <div className="border border-zinc-800 border-t-0 px-4 py-3 mb-px bg-zinc-900/20">
                            <p className="text-xs text-zinc-400 leading-relaxed mb-3">{task.description}</p>
                            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 ? (
                              <div className="mb-3">
                                <p className="font-mono text-[9px] text-zinc-600 mb-1.5 tracking-wider uppercase">
                                  Acceptance Criteria
                                </p>
                                <ul className="space-y-1">
                                  {task.acceptanceCriteria.map(function (c, i) {
                                    return (
                                      <li key={i} className="flex gap-2 text-xs text-zinc-500">
                                        <span className="font-mono text-zinc-700">{i + 1}.</span>
                                        {c}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : null}
                            <span className="font-mono text-[9px] text-zinc-700">
                              {task.estimatedPoints} pts estimated
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}