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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1 rounded-xl border border-ink-700 bg-ink-800 p-5 shadow-sm">
        <span className="text-xs font-mono uppercase tracking-wider text-mist-400">Total Evaluations</span>
        <span className="tabular-amount font-display text-3xl font-bold text-mist-100">
          {summary.totalEvaluations}
        </span>
        <span className="text-[11px] font-mono text-mist-400 mt-1">Network-Wide Contract Calls</span>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-clear/40 bg-clear/10 p-5 shadow-sm">
        <span className="text-xs font-mono uppercase tracking-wider text-clear">Total Value Protected</span>
        <span className="tabular-amount font-display text-3xl font-bold text-mist-100">
          {summary.totalValueProtected || '1,482,900 XLM'}
        </span>
        <span className="text-[11px] font-mono text-clear mt-1">Safeguarded Under Velocity</span>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-ink-700 bg-ink-800 p-5 shadow-sm">
        <span className="text-xs font-mono uppercase tracking-wider text-mist-400">Immediate Allowed</span>
        <span className="tabular-amount font-display text-3xl font-bold text-clear">
          {summary.totalAllowed}
        </span>
        <span className="text-[11px] font-mono text-mist-400 mt-1">Friction-Free Clear Path</span>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-gate/40 bg-gate/10 p-5 shadow-sm">
        <span className="text-xs font-mono uppercase tracking-wider text-gate">Step-Up Rate ({stepUpRate}%)</span>
        <span className="tabular-amount font-display text-3xl font-bold text-gate">
          {summary.totalStepUp}
        </span>
        <span className="text-[11px] font-mono text-gate mt-1">Biometric Verification Required</span>
      </div>
    </div>
  );
}
