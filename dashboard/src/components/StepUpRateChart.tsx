import type { TimeseriesPoint } from '@/lib/api';

interface StepUpRateChartProps {
  points: TimeseriesPoint[];
}

export function StepUpRateChart({ points }: StepUpRateChartProps) {
  const max = Math.max(1, ...points.map((p) => p.allowed + p.stepUp));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ink-700 bg-ink-800 p-5">
      <h2 className="font-display text-lg font-semibold text-mist-100">Allowed vs. step-up over time</h2>
      {points.length === 0 ? (
        <p className="text-sm text-mist-400">No evaluations recorded yet in this window.</p>
      ) : (
        <div className="flex h-32 items-end gap-1" role="img" aria-label="Daily allowed versus step-up counts">
          {points.map((point) => {
            const total = point.allowed + point.stepUp;
            const allowedHeight = total > 0 ? (point.allowed / max) * 100 : 0;
            const stepUpHeight = total > 0 ? (point.stepUp / max) * 100 : 0;
            return (
              <div
                key={point.date}
                className="flex flex-1 flex-col justify-end gap-px"
                title={`${point.date}: ${point.allowed} allowed, ${point.stepUp} step-up`}
              >
                <div
                  className="w-full rounded-t-sm transition-[height] duration-300"
                  style={{ height: `${stepUpHeight}%`, backgroundColor: 'var(--color-gate)' }}
                />
                <div
                  className="w-full transition-[height] duration-300"
                  style={{ height: `${allowedHeight}%`, backgroundColor: 'var(--color-clear)' }}
                />
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-4 text-sm text-mist-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-clear)' }} />
          Allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-gate)' }} />
          Step-up
        </span>
      </div>
    </div>
  );
}
