'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSummary, getTimeseries, getGlobalActivity, type Summary, type TimeseriesPoint, type GlobalActivityItem } from '@/lib/api';
import { SummaryCards } from '@/components/SummaryCards';
import { ReasonBreakdownChart } from '@/components/ReasonBreakdownChart';
import { StepUpRateChart } from '@/components/StepUpRateChart';
import { GlobalActivityStream } from '@/components/GlobalActivityStream';

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [activity, setActivity] = useState<GlobalActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletQuery, setWalletQuery] = useState('');

  useEffect(() => {
    Promise.all([getSummary(), getTimeseries(30), getGlobalActivity()])
      .then(([s, t, a]) => {
        setSummary(s);
        setTimeseries(t);
        setActivity(a);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const PRESET_WALLETS = [
    {
      address: 'GB7V...281K',
      fullAddress: 'GB7VR6K5ZPQW8H1LN3M8YX2T9K4V1R7P0S2A4D6F8H9J1L3N5P7Q9S1T',
      tag: 'Active Vault',
      desc: 'Frequent transfers, trusted counterparties',
      type: 'clear',
    },
    {
      address: 'GD5F...821K',
      fullAddress: 'GD5F821K9QW4P1LN3M8YX2T9K4V1R7P0S2A4D6F8H9J1L3N5P7Q9S1T9',
      tag: 'Step-Up Sample',
      desc: 'Simulated high-value transfers over limit',
      type: 'gate',
    },
    {
      address: 'GC9A...419P',
      fullAddress: 'GC9A419P8H1LN3M8YX2T9K4V1R7P0S2A4D6F8H9J1L3N5P7Q9S1T9A2B',
      tag: 'Challenged Account',
      desc: 'Elevated surveillance & guardian setup',
      type: 'info',
    },
    {
      address: 'GNEW...99ZA',
      fullAddress: 'GNEW99ZAW8H1LN3M8YX2T9K4V1R7P0S2A4D6F8H9J1L3N5P7Q9S1T9XY',
      tag: 'Fresh Account',
      desc: 'Unconfigured policy baseline',
      type: 'neutral',
    },
  ];

  return (
    <div className="min-h-screen bg-ink-900 text-mist-100 selection:bg-clear/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-clear/30 bg-ink-800 text-clear shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-mist-100">
                  WARDEN MONITOR
                </span>
                <span className="rounded bg-clear/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-clear">
                  Live Indexer
                </span>
              </div>
              <p className="text-[11px] font-mono text-mist-400">
                Stellar Soroban Network Observability Subsystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs text-mist-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clear opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-clear" />
              </span>
              <span>Soroban Protocol 22</span>
            </div>
            <div className="rounded-full border border-ink-700/80 bg-ink-800/80 px-3 py-1 text-xs font-mono text-mist-400">
              Zero Write Path
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        {/* Header Hero */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-mist-100 sm:text-4xl">
                Global Activity Stream
              </h1>
              <p className="mt-1 max-w-2xl text-base text-mist-400">
                Real-time chart of all policy evaluations, total value protected, and network-wide step-up rates across all wallets.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 p-2 text-xs text-mist-400">
              <span className="h-2 w-2 rounded-full bg-clear" />
              <span>Read-only observability over <span className="font-mono text-mist-100">warden-contract</span></span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ink-700 bg-ink-800/40 py-24 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-clear border-t-transparent" />
            <p className="text-sm font-medium text-mist-400">Loading live telemetry and ledger states…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-fault/30 bg-fault/10 p-6 text-center">
            <p role="alert" className="text-fault font-medium">
              {error}
            </p>
          </div>
        ) : summary ? (
          <>
            {/* 4 Summary Cards including Total Value Protected */}
            <SummaryCards summary={summary} />

            {/* Charts Section: StepUpRateChart & ReasonBreakdownChart */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <StepUpRateChart points={timeseries} />
              <ReasonBreakdownChart byReason={summary.byReason} />
            </div>

            {/* Global Activity Stream Table */}
            <GlobalActivityStream initialActivity={activity} />
          </>
        ) : null}

        {/* Look up a wallet Section */}
        <section className="flex flex-col gap-6 rounded-xl border border-ink-700 bg-ink-800/50 p-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-mist-100">
              Wallet Deep-Dive Search
            </h2>
            <p className="text-sm text-mist-400">
              Search any Stellar address to view its full indexed timeline of state transitions, velocity resets, and recovery events.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (walletQuery) {
                window.location.href = `/wallet/${encodeURIComponent(walletQuery)}`;
              }
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="walletSearch" className="text-sm font-medium text-mist-100">
              Look up a wallet
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="walletSearch"
                type="text"
                value={walletQuery}
                onChange={(event) => setWalletQuery(event.target.value)}
                placeholder="G… or C… address (e.g. GB7VR6K5ZPQW8H1LN...)"
                className="address-mono flex-1 rounded-md border border-ink-700 bg-ink-800 px-4 py-3 text-sm text-mist-100 outline-none transition-colors placeholder:text-mist-400/60 focus-visible:border-edge"
              />
              <Link
                href={walletQuery ? `/wallet/${encodeURIComponent(walletQuery)}` : '#'}
                aria-disabled={!walletQuery}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-700 bg-ink-800 px-6 py-3 font-medium text-mist-100 transition-colors hover:border-edge hover:bg-ink-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <span>View Deep-Dive</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </form>

          {/* Quick-Jump Preset Addresses */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-mono uppercase tracking-wider text-mist-400">
              Quick Testnet Addresses to Explore:
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PRESET_WALLETS.map((preset) => (
                <button
                  key={preset.address}
                  type="button"
                  onClick={() => setWalletQuery(preset.fullAddress)}
                  className="flex flex-col gap-1 rounded-lg border border-ink-700/80 bg-ink-900/60 p-3 text-left transition-colors hover:border-edge hover:bg-ink-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="address-mono text-xs font-semibold text-mist-100">
                      {preset.address}
                    </span>
                    <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-mono text-mist-400">
                      {preset.tag}
                    </span>
                  </div>
                  <span className="text-[11px] text-mist-400">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-ink-700/80 py-8 text-center text-xs text-mist-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-mist-100">Warden Monitor Subsystem</span>
            <span>•</span>
            <span>Read-Only Invariant: Zero Write Capability</span>
          </div>
          <div className="flex gap-4 font-mono text-[11px]">
            <span>Contract: CD5QU...VUW</span>
            <span>Network: SDF Testnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
