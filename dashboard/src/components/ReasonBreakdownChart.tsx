import type { Summary } from '@/lib/api';

interface ReasonBreakdownChartProps {
  byReason: Summary['byReason'];
}

const LABELS: Record<keyof Summary['byReason'], string> = {
  amountExceeded: 'Amount over limit',
  newRecipient: 'New recipient',
  velocityExceeded: 'Over daily limit',
};

export function ReasonBreakdownChart({ byReason }: ReasonBreakdownChartProps) {
  const entries = (Object.keys(LABELS) as (keyof Summary['byReason'])[]).map((key) => ({
    key,
    label: LABELS[key],
    value: byReason[key],
  }));
  const max = Math.max(1, ...entries.map((e) => e.value));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ink-700 bg-ink-800 p-5">
      <h2 className="font-display text-lg font-semibold text-mist-100">Step-up reasons</h2>
      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <div key={entry.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-mist-400">{entry.label}</span>
              <span className="tabular-amount text-mist-100">{entry.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-ink-700)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${(entry.value / max) * 100}%`, backgroundColor: 'var(--color-gate)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
