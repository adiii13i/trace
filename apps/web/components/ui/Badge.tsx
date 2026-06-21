import clsx from 'clsx';

type Variant = 'in_progress' | 'blocked' | 'in_review' | 'review' | 'verified' | 'pending'
             | 'critical' | 'high' | 'medium' | 'low' | 'active' | 'paused' | 'completed';

const VARIANT_CLASSES: Record<Variant, string> = {
  in_progress: 'border-blue-500 text-blue-400',
  blocked:     'border-red-500 text-red-400',
  in_review:   'border-amber-500 text-amber-400',
  review:      'border-amber-500 text-amber-400',
  verified:    'border-green-500 text-green-400',
  pending:     'border-zinc-600 text-zinc-500',
  critical:    'border-red-500 text-red-400 bg-red-500/5',
  high:        'border-amber-500 text-amber-400 bg-amber-500/5',
  medium:      'border-blue-500 text-blue-400 bg-blue-500/5',
  low:         'border-zinc-600 text-zinc-500',
  active:      'border-green-500 text-green-400',
  paused:      'border-amber-500 text-amber-400',
  completed:   'border-zinc-600 text-zinc-500',
};

const LABELS: Record<Variant, string> = {
  in_progress: 'IN PROGRESS',
  blocked:     'BLOCKED',
  in_review:   'IN REVIEW',
  review:      'REVIEW',
  verified:    'VERIFIED',
  pending:     'PENDING',
  critical:    'CRITICAL',
  high:        'HIGH',
  medium:      'MEDIUM',
  low:         'LOW',
  active:      'ACTIVE',
  paused:      'PAUSED',
  completed:   'COMPLETED',
};

export function Badge({ variant }: { variant: Variant }) {
  return (
    <span
      className={clsx(
        'inline-block font-mono text-[9px] px-1.5 py-0.5 border tracking-wider',
        VARIANT_CLASSES[variant]
      )}
    >
      {LABELS[variant]}
    </span>
  );
}
