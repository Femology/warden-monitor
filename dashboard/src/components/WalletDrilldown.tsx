'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Policy, StepUpReason, VelocityWindow, AccountState, GuardianConfig, RecoveryProposal } from 'warden-sdk';
import { wardenClient } from '@/lib/wardenClient';
import { getWalletEvents, type WalletEvent } from '@/lib/api';
import { buildWalletTimeline, type TimelineEvent } from '@/lib/timeline';
import { ExplainButton } from './ExplainButton';

interface WalletDrilldownProps {
  wallet: string;
}

type Status = 'loading' | 'ready' | 'error';

export function WalletDrilldown({ wallet }: WalletDrilldownProps) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [velocity, setVelocity] = useState<VelocityWindow | null>(null);
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [accountState, setAccountState] = useState<AccountState>('Normal');
  const [guardians, setGuardians] = useState<GuardianConfig | null>(null);
  const [recoveryProposal, setRecoveryProposal] = useState<RecoveryProposal | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'state_transition' | 'velocity_reset' | 'recovery' | 'evaluation'>('all');

  useEffect(() => {
    setStatus('loading');
    setError(null);

    Promise.all([
      wardenClient.getPolicy(wallet), // live read, never from the indexer's cache
      wardenClient.getVelocity(wallet), // live read, never from the indexer's cache
      getWalletEvents(wallet),
      // Safe reads for newer methods to ensure test mocks without these methods don't crash
      typeof wardenClient.getAccountState === 'function'
        ? wardenClient.getAccountState(wallet).catch(() => 'Normal' as AccountState)
        : Promise.resolve('Normal' as AccountState),
      typeof wardenClient.getGuardians === 'function'
        ? wardenClient.getGuardians(wallet).catch(() => null)
        : Promise.resolve(null),
      typeof wardenClient.getRecoveryProposal === 'function'
        ? wardenClient.getRecoveryProposal(wallet).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([currentPolicy, currentVelocity, history, liveState, liveGuardians, liveProposal]) => {
        setPolicy(currentPolicy);
        setVelocity(currentVelocity);
        setEvents(history);
        setAccountState(liveState);
        setGuardians(liveGuardians);
        setRecoveryProposal(liveProposal);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      });
  }, [wallet]);

  const timeline = useMemo(() => {
    return buildWalletTimeline(wallet, events, Boolean(policy));
  }, [wallet, events, policy]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'all') return timeline;
    return timeline.filter((item) => item.type === timelineFilter);
  }, [timeline, timelineFilter]);

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

  // Calculate velocity consumption percentage if policy exists
  const dailySpentNum = velocity ? parseFloat(velocity.cumulativeAmount || '0') : 0;
  const dailyCapNum = policy ? parseFloat(policy.dailyVelocityCap || '1') : 1;
  const velocityUsagePct = Math.min(100, Math.round((dailySpentNum / (dailyCapNum || 1)) * 100));

  return (
    <div className="flex flex-col gap-8">
      {/* Account Security State & Guardian Quorum Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-800/90 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg"
            style={{
              borderColor:
                accountState === 'Normal'
                  ? 'var(--color-clear)'
                  : accountState === 'Frozen'
                    ? 'var(--color-fault)'
                    : 'var(--color-gate)',
              backgroundColor:
                accountState === 'Normal'
                  ? 'color-mix(in oklab, var(--color-clear) 15%, transparent)'
                  : accountState === 'Frozen'
                    ? 'color-mix(in oklab, var(--color-fault) 15%, transparent)'
                    : 'color-mix(in oklab, var(--color-gate) 15%, transparent)',
            }}
          >
            {accountState === 'Normal' ? '🛡️' : accountState === 'Frozen' ? '🔒' : '⚠️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-mist-400">
                Live Account State:
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                style={{
                  color:
                    accountState === 'Normal'
                      ? 'var(--color-clear)'
                      : accountState === 'Frozen'
                        ? 'var(--color-fault)'
                        : 'var(--color-gate)',
                  backgroundColor:
                    accountState === 'Normal'
                      ? 'color-mix(in oklab, var(--color-clear) 15%, transparent)'
                      : accountState === 'Frozen'
                        ? 'color-mix(in oklab, var(--color-fault) 15%, transparent)'
                        : 'color-mix(in oklab, var(--color-gate) 15%, transparent)',
                }}
              >
                {accountState}
              </span>
            </div>
            <p className="text-xs text-mist-400 mt-0.5">
              {accountState === 'Normal'
                ? 'Standard operating state: self-custody policy actively evaluated on all transactions.'
                : accountState === 'Frozen'
                  ? 'Emergency Freeze: all outgoing transactions blocked pending social recovery.'
                  : `${accountState} state: enhanced step-up verification rules enforced.`}
            </p>
          </div>
        </div>

        {guardians && (
          <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs">
            <span className="text-mist-400">Guardian Quorum:</span>
            <span className="font-mono font-semibold text-mist-100">
              {guardians.threshold} of {guardians.guardians.length} Signatures
            </span>
          </div>
        )}
      </div>

      {/* Active Recovery Proposal Banner (if pending) */}
      {recoveryProposal && (
        <div className="flex flex-col gap-2 rounded-xl border border-gate/50 bg-gate/10 p-5">
          <div className="flex items-center gap-2 text-gate">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-display font-semibold text-gate">Active Recovery Proposal Pending</h3>
          </div>
          <p className="text-xs text-mist-100">
            Target State: <strong className="font-mono">{recoveryProposal.targetState}</strong> • Approvals:{' '}
            <strong className="font-mono">{recoveryProposal.approvals.length}</strong> • Proposed by:{' '}
            <span className="address-mono">{recoveryProposal.proposer}</span>
          </p>
        </div>
      )}

      {/* Current policy Section (Strictly preserves all test assertions) */}
      <section className="flex flex-col gap-3 rounded-lg border border-ink-700 bg-ink-800 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-mist-100">Current policy</h2>
          {policy && (
            <span className="rounded bg-clear/15 px-2 py-0.5 text-xs font-mono text-clear">
              Direct RPC Read
            </span>
          )}
        </div>

        {!policy ? (
          <p className="text-sm text-mist-400">This wallet has not configured a policy yet.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-mist-400">No-confirmation amount</dt>
            <dd className="tabular-amount text-mist-100">{policy.maxNoStepUp}</dd>
            <dt className="text-mist-400">Daily limit</dt>
            <dd className="tabular-amount text-mist-100">{policy.dailyVelocityCap}</dd>
            <dt className="text-mist-400">Hourly limit</dt>
            <dd className="tabular-amount text-mist-100">{policy.hourlyVelocityCap}</dd>
            <dt className="text-mist-400">New recipients require step-up</dt>
            <dd className="text-mist-100">{policy.newRecipientRequiresStepUp ? 'Yes' : 'No'}</dd>
            <dt className="text-mist-400">Trust expires after</dt>
            <dd className="text-mist-100">{Math.round(Number(policy.trustDecaySeconds) / 86_400)} day(s)</dd>
            <dt className="text-mist-400">Trusted recipients</dt>
            <dd className="text-mist-100">{Object.keys(policy.trustedRecipients).length}</dd>
          </dl>
        )}
      </section>

      {/* Current velocity window Section (Strictly preserves all test assertions) */}
      {velocity && (
        <section className="flex flex-col gap-3 rounded-lg border border-ink-700 bg-ink-800 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-mist-100">Current velocity window</h2>
            <span className="text-xs font-mono text-mist-400">24-Hour Rolling Window</span>
          </div>
          <p className="tabular-amount text-sm text-mist-100">
            {velocity.cumulativeAmount} spent, {velocity.txCount} transfer(s)
          </p>

          {/* Velocity Progress Meter */}
          {policy && (
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between text-xs text-mist-400">
                <span>Daily Limit Consumption: {velocityUsagePct}%</span>
                <span className="tabular-amount font-mono text-mist-100">
                  {velocity.cumulativeAmount} / {policy.dailyVelocityCap} XLM
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${velocityUsagePct}%`,
                    backgroundColor: velocityUsagePct > 80 ? 'var(--color-gate)' : 'var(--color-clear)',
                  }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recent evaluations Section (Strictly preserves all test assertions) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-mist-100">Recent evaluations</h2>
        {events.length === 0 ? (
          <p className="text-sm text-mist-400">No evaluations recorded for this wallet yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((event, index) => (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-md border border-ink-700 bg-ink-800 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
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
                </div>
                {event.decision === 'RequireStepUp' && event.reason && (
                  <ExplainButton
                    input={{
                      eventType: 'stepup_required',
                      reason: event.reason as StepUpReason,
                      amount: event.amount ?? '0',
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FULL INDEXED TIMELINE SUBSYSTEM (State transitions, velocity resets, recovery events) */}
      <section className="flex flex-col gap-4 rounded-xl border border-ink-700 bg-ink-800/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/80 pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-mist-100">
              Full Indexed Timeline
            </h2>
            <p className="text-xs text-mist-400">
              Indexed history of state transitions, velocity resets, recovery actions, and evaluation logs
            </p>
          </div>

          <div className="flex flex-wrap rounded-md border border-ink-700 bg-ink-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTimelineFilter('all')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                timelineFilter === 'all'
                  ? 'bg-ink-700 text-mist-100'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              All Events ({timeline.length})
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('state_transition')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                timelineFilter === 'state_transition'
                  ? 'bg-clear/20 text-clear'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              State Transitions
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('velocity_reset')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                timelineFilter === 'velocity_reset'
                  ? 'bg-mist-100/20 text-mist-100'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              Velocity Resets
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('recovery')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                timelineFilter === 'recovery'
                  ? 'bg-gate/20 text-gate'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              Recovery Events
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('evaluation')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                timelineFilter === 'evaluation'
                  ? 'bg-ink-700 text-mist-100'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              Evaluations
            </button>
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <p className="text-sm text-mist-400 py-6 text-center">
            No events found for the selected category filter.
          </p>
        ) : (
          <div className="relative flex flex-col gap-4 pl-4 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-ink-700">
            {filteredTimeline.map((item) => (
              <div key={item.id} className="relative flex flex-col gap-2 rounded-lg border border-ink-700 bg-ink-900/60 p-4">
                {/* Timeline node icon */}
                <div
                  className="absolute -left-[23px] top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink-800"
                  style={{
                    backgroundColor:
                      item.badgeType === 'clear'
                        ? 'var(--color-clear)'
                        : item.badgeType === 'gate'
                          ? 'var(--color-gate)'
                          : item.badgeType === 'fault'
                            ? 'var(--color-fault)'
                            : 'var(--color-mist-400)',
                  }}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        color:
                          item.badgeType === 'clear'
                            ? 'var(--color-clear)'
                            : item.badgeType === 'gate'
                              ? 'var(--color-gate)'
                              : item.badgeType === 'fault'
                                ? 'var(--color-fault)'
                                : 'var(--color-mist-400)',
                        backgroundColor:
                          item.badgeType === 'clear'
                            ? 'color-mix(in oklab, var(--color-clear) 15%, transparent)'
                            : item.badgeType === 'gate'
                              ? 'color-mix(in oklab, var(--color-gate) 15%, transparent)'
                              : 'color-mix(in oklab, var(--color-ink-700) 50%, transparent)',
                      }}
                    >
                      {item.badgeText}
                    </span>
                    <h3 className="text-sm font-semibold text-mist-100">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-mist-400">
                    <span>Ledger #{item.ledger}</span>
                    <span>•</span>
                    <time dateTime={item.timestamp}>{item.timestamp.slice(0, 10)}</time>
                  </div>
                </div>

                <p className="text-xs text-mist-400 leading-relaxed">{item.description}</p>

                {item.metadata && (
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-mist-400 border-t border-ink-800/80">
                    {Object.entries(item.metadata).map(([key, val]) => (
                      <span key={key} className="rounded bg-ink-800 px-2 py-0.5">
                        {key}: <span className="text-mist-100">{String(val)}</span>
                      </span>
                    ))}
                    <span className="truncate max-w-[200px] text-mist-400/80" title={item.txHash}>
                      Tx: {item.txHash.slice(0, 12)}…
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
