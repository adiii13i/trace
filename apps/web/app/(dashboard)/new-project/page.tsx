'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { apiFetch } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    name: '', description: '', repoUrl: '', prompt: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.repoUrl || !form.prompt) {
      setError('Name, repository URL, and task prompt are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create project');
        return;
      }
      const { project } = await res.json();
      router.push(`/dashboard`);
    } catch (err) {
      setError('Network error. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6 max-w-xl">
        <p className="font-mono text-[10px] text-zinc-600 mb-1 tracking-wider">MAIN &gt; NEW PROJECT</p>
        <h1 className="text-lg font-medium tracking-tight text-zinc-100 mb-6">Create Project</h1>

        <div className="space-y-px">
          <Field label="PROJECT NAME">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Cloud Infrastructure Redesign"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 font-sans outline-none focus:border-zinc-600 placeholder:text-zinc-700"
            />
          </Field>

          <Field label="GITHUB REPOSITORY URL">
            <input
              type="url"
              value={form.repoUrl}
              onChange={(e) => setForm((p) => ({ ...p, repoUrl: e.target.value }))}
              placeholder="https://github.com/org/repo"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-600 placeholder:text-zinc-700"
            />
          </Field>

          <Field label="DESCRIPTION (OPTIONAL)">
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief project overview"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 font-sans outline-none focus:border-zinc-600 placeholder:text-zinc-700"
            />
          </Field>

          <Field label="TASK GENERATION PROMPT">
            <textarea
              value={form.prompt}
              onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
              placeholder="Describe the project goals, tech stack, and what needs to be built. The AI will break this into specific engineering tasks."
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 font-sans outline-none focus:border-zinc-600 placeholder:text-zinc-700 resize-none"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 font-mono text-[10px] text-red-400 border border-red-900/50 px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 font-mono text-[10px] tracking-wider hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 size={10} className="animate-spin" />}
            {loading ? 'GENERATING TASKS...' : 'CREATE PROJECT'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-zinc-800 text-zinc-500 font-mono text-[10px] hover:text-zinc-300 transition-colors"
          >
            CANCEL
          </button>
        </div>

        {loading && (
          <p className="mt-3 font-mono text-[10px] text-zinc-600">
            AI is generating tasks from your prompt. This may take 10–20 seconds...
          </p>
        )}
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[9px] text-zinc-600 tracking-widest mb-1.5 mt-4">
        {label}
      </label>
      {children}
    </div>
  );
}
