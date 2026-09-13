'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SEED_GLOBAL_ACTIVITY, type GlobalActivityItem } from '@/lib/api';

interface GlobalActivityStreamProps {
  initialActivity?: GlobalActivityItem[];
}

export function GlobalActivityStream({ initialActivity = SEED_GLOBAL_ACTIVITY }: GlobalActivityStreamProps) {
  const [activity, setActivity] = useState<GlobalActivityItem[]>(initialActivity);
  const [filter, setFilter] = useState<'all' | 'allow' | 'stepup'>('all');
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time streaming updates when isLive is active
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const isAllowed = Math.random() > 0.35;
      const reasons = ['AmountExceeded', 'NewRecipient', 'VelocityExceeded'] as const;
      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
      const randomAmount = isAllowed
        ? `${(Math.random() * 80 + 5).toFixed(2)} XLM`
        : `${(Math.random() * 800 + 150).toFixed(2)} XLM`;

      const randomWalletSuffix = Math.floor(Math.random() * 900 + 100);
      const randomRecipientSuffix = Math.floor(Math.random() * 900 + 100);

      const newItem: GlobalActivityItem = {
        id: `stream-${Date.now()}`,
        wallet: `GB${randomWalletSuffix}...${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        recipient: `GC${randomRecipientSuffix}...${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        amount: randomAmount,
        decision: isAllowed ? 'Allow' : 'RequireStepUp',
        reason: isAllowed ? null : randomReason,
        ledger: 52891402 + Math.floor(Math.random() * 20),
        timestamp: 'Just now',
        txHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };

      setActivity((prev) => [newItem, ...prev.slice(0, 19)]);
    }, 9000);

    return () => clearInterval(interval);
  }, [isLive]);

  const filteredItems = activity.filter((item) => {
    if (filter === 'allow') return item.decision === 'Allow';
    if (filter === 'stepup') return item.decision === 'RequireStepUp';
    return true;
  });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink-700 bg-ink-800/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {isLive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clear opacity-75" />
            )}
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: isLive ? 'var(--color-clear)' : 'var(--color-mist-400)' }}
            />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-mist-100">Global Activity Stream</h2>
            <p className="text-xs text-mist-400">
              Real-time feed of Soroban smart contract policy evaluations across all enrolled accounts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-mist-100 transition-colors hover:border-edge"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: isLive ? 'var(--color-clear)' : 'var(--color-fault)' }}
            />
            {isLive ? 'Live Stream Active' : 'Stream Paused'}
          </button>

          <div className="flex rounded-md border border-ink-700 bg-ink-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-ink-700 text-mist-100'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              All ({activity.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('allow')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                filter === 'allow'
                  ? 'bg-clear/20 text-clear'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              Allowed
            </button>
            <button
              type="button"
              onClick={() => setFilter('stepup')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                filter === 'stepup'
                  ? 'bg-gate/20 text-gate'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              Step-Up
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-xs font-mono uppercase tracking-wider text-mist-400">
              <th className="pb-3 pr-4 font-normal">Ledger / Age</th>
              <th className="pb-3 pr-4 font-normal">Sender Wallet</th>
              <th className="pb-3 pr-4 font-normal">Recipient</th>
              <th className="pb-3 pr-4 font-normal text-right">Amount</th>
              <th className="pb-3 pr-4 font-normal">Verdict</th>
              <th className="pb-3 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/50">
            {filteredItems.map((item) => {
              const isAllow = item.decision === 'Allow';
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-ink-700/30"
                >
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-mist-100">#{item.ledger}</span>
                      <span className="text-[11px] text-mist-400">{item.timestamp}</span>
                    </div>
                  </td>

                  <td className="py-3 pr-4">
                    <Link
                      href={`/wallet/${encodeURIComponent(item.wallet)}`}
                      className="address-mono text-xs font-medium text-clear hover:underline"
                      title="Inspect wallet deep-dive"
                    >
                      {item.wallet}
                    </Link>
                  </td>

                  <td className="py-3 pr-4 font-mono text-xs text-mist-400">
                    {item.recipient}
                  </td>

                  <td className="tabular-amount py-3 pr-4 text-right font-medium text-mist-100">
                    {item.amount}
                  </td>

                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        color: isAllow ? 'var(--color-clear)' : 'var(--color-gate)',
                        backgroundColor: isAllow
                          ? 'color-mix(in oklab, var(--color-clear) 15%, transparent)'
                          : 'color-mix(in oklab, var(--color-gate) 15%, transparent)',
                      }}
                    >
                      {isAllow ? (
                        <>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Allow
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {item.reason ?? 'Step-Up Required'}
                        </>
                      )}
                    </span>
                  </td>

                  <td className="py-3 text-right">
                    <Link
                      href={`/wallet/${encodeURIComponent(item.wallet)}`}
                      className="inline-flex items-center gap-1 rounded border border-ink-700 bg-ink-900/60 px-2 py-1 text-xs text-mist-400 transition-colors hover:border-edge hover:text-mist-100"
                    >
                      Inspect
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-mist-400">
        <span>Showing {filteredItems.length} indexed policy verdicts</span>
        <span className="font-mono text-[11px]">Soroban Contract: CD5Q...EVUW • Zero-Write Read-Only</span>
      </div>
    </div>
  );
}
