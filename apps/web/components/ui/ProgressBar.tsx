export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-px bg-zinc-800 relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-zinc-300 dark:bg-zinc-400 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
