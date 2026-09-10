'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSummary, getTimeseries, type Summary, type TimeseriesPoint } from '@/lib/api';
import { SummaryCards } from '@/components/SummaryCards';
import { ReasonBreakdownChart } from '@/components/ReasonBreakdownChart';
import { StepUpRateChart } from '@/components/StepUpRateChart';

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletQuery, setWalletQuery] = useState('');

  useEffect(() => {
    Promise.all([getSummary(), getTimeseries(30)])
      .then(([s, t]) => {
        setSummary(s);
        setTimeseries(t);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-mist-100">Warden Monitor</h1>
        <p className="text-mist-400">
          Read-only observability over warden-contract&apos;s on-chain events. This dashboard
          cannot influence any allow/step-up decision.
        </p>
      </header>

      {loading ? (
        <p className="text-mist-400">Loading…</p>
      ) : error ? (
        <p role="alert" className="text-fault">
          {error}
        </p>
      ) : summary ? (
        <>
          <SummaryCards summary={summary} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReasonBreakdownChart byReason={summary.byReason} />
            <StepUpRateChart points={timeseries} />
          </div>
        </>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        className="flex flex-col gap-2 border-t border-ink-700 pt-8"
      >
        <label htmlFor="walletSearch" className="text-sm font-medium text-mist-100">
          Look up a wallet
        </label>
        <div className="flex gap-3">
          <input
            id="walletSearch"
            type="text"
            value={walletQuery}
            onChange={(event) => setWalletQuery(event.target.value)}
            placeholder="G… or C… address"
            className="address-mono flex-1 rounded-md border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-mist-100 outline-none focus-visible:border-edge"
          />
          <Link
            href={walletQuery ? `/wallet/${encodeURIComponent(walletQuery)}` : '#'}
            aria-disabled={!walletQuery}
            className="rounded-md border border-ink-700 px-5 py-2.5 font-medium text-mist-100 transition-colors hover:border-edge aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            View
          </Link>
        </div>
      </form>
    </main>
  );
}
