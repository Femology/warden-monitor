import type { Summary } from '@/lib/api';

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const stepUpRate =
    summary.totalEvaluations > 0
      ? Math.round((summary.totalStepUp / summary.totalEvaluations) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1 rounded-lg border border-ink-700 bg-ink-800 p-5">
        <span className="text-sm text-mist-400">Total evaluations</span>
        <span className="tabular-amount font-display text-3xl font-semibold text-mist-100">
          {summary.totalEvaluations}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border p-5" style={{ borderColor: 'var(--color-clear)', backgroundColor: 'var(--color-ink-800)' }}>
        <span className="text-sm text-mist-400">Allowed</span>
        <span className="tabular-amount font-display text-3xl font-semibold" style={{ color: 'var(--color-clear)' }}>
          {summary.totalAllowed}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border p-5" style={{ borderColor: 'var(--color-gate)', backgroundColor: 'var(--color-ink-800)' }}>
        <span className="text-sm text-mist-400">Step-up ({stepUpRate}%)</span>
        <span className="tabular-amount font-display text-3xl font-semibold" style={{ color: 'var(--color-gate)' }}>
          {summary.totalStepUp}
        </span>
      </div>
    </div>
  );
}
