'use client';

import { useEffect, useState } from 'react';
import type { Policy, VelocityWindow } from 'warden-sdk';
import { wardenClient } from '@/lib/wardenClient';
import { getWalletEvents, type WalletEvent } from '@/lib/api';

interface WalletDrilldownProps {
  wallet: string;
}

type Status = 'loading' | 'ready' | 'error';

export function WalletDrilldown({ wallet }: WalletDrilldownProps) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [velocity, setVelocity] = useState<VelocityWindow | null>(null);
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');
    setError(null);
    Promise.all([
      wardenClient.getPolicy(wallet), // live read, never from the indexer's cache
      wardenClient.getVelocity(wallet), // live read, never from the indexer's cache
      getWalletEvents(wallet),
    ])
      .then(([currentPolicy, currentVelocity, history]) => {
        setPolicy(currentPolicy);
        setVelocity(currentVelocity);
        setEvents(history);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      });
  }, [wallet]);

  if (status === 'loading') {
    return <p className="text-mist-400">Loading…</p>;
  }
  if (status === 'error') {
    return (
      <p role="alert" className="text-fault">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-lg border border-ink-700 bg-ink-800 p-5">
        <h2 className="font-display text-lg font-semibold text-mist-100">Current policy</h2>
        {!policy ? (
          <p className="text-sm text-mist-400">This wallet has not configured a policy yet.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-mist-400">No-confirmation amount</dt>
            <dd className="tabular-amount text-mist-100">{policy.maxNoStepUp}</dd>
            <dt className="text-mist-400">Daily limit</dt>
            <dd className="tabular-amount text-mist-100">{policy.dailyVelocityCap}</dd>
            <dt className="text-mist-400">New recipients require step-up</dt>
            <dd className="text-mist-100">{policy.newRecipientRequiresStepUp ? 'Yes' : 'No'}</dd>
            <dt className="text-mist-400">Trusted recipients</dt>
            <dd className="text-mist-100">{policy.trustedRecipients.length}</dd>
          </dl>
        )}
      </section>

      {velocity && (
        <section className="flex flex-col gap-2 rounded-lg border border-ink-700 bg-ink-800 p-5">
          <h2 className="font-display text-lg font-semibold text-mist-100">Current velocity window</h2>
          <p className="tabular-amount text-sm text-mist-100">
            {velocity.cumulativeAmount} spent, {velocity.txCount} transfer(s)
          </p>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-mist-100">Recent evaluations</h2>
        {events.length === 0 ? (
          <p className="text-sm text-mist-400">No evaluations recorded for this wallet yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((event, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-3 rounded-md border border-ink-700 bg-ink-800 px-4 py-3 text-sm"
              >
                <span className="address-mono text-mist-400">
                  {event.recipient ? `${event.recipient.slice(0, 6)}…${event.recipient.slice(-6)}` : '—'}
                </span>
                <span className="tabular-amount text-mist-100">{event.amount}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    color: event.decision === 'Allow' ? 'var(--color-clear)' : 'var(--color-gate)',
                    backgroundColor:
                      event.decision === 'Allow'
                        ? 'color-mix(in oklab, var(--color-clear) 15%, transparent)'
                        : 'color-mix(in oklab, var(--color-gate) 15%, transparent)',
                  }}
                >
                  {event.decision === 'Allow' ? 'Allow' : event.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
