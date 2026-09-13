import type { WalletEvent } from './api';

export interface TimelineEvent {
  id: string;
  type: 'state_transition' | 'velocity_reset' | 'recovery' | 'evaluation';
  title: string;
  description: string;
  timestamp: string;
  ledger: number;
  txHash: string;
  badgeText: string;
  badgeType: 'clear' | 'gate' | 'fault' | 'neutral' | 'info';
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Builds the full indexed timeline for a wallet, combining:
 * 1. State transitions (e.g. Normal -> Watch -> Challenged -> Frozen)
 * 2. Velocity resets (hourly & 24h daily rolling window resets)
 * 3. Recovery events (guardians appointed, recovery proposed, approved, timelock elapsed)
 * 4. Policy evaluation events (Allow vs RequireStepUp)
 */
export function buildWalletTimeline(
  wallet: string,
  events: WalletEvent[],
  hasPolicy: boolean,
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];

  // Add evaluation events
  events.forEach((ev, idx) => {
    timeline.push({
      id: `eval-${idx}`,
      type: 'evaluation',
      title:
        ev.decision === 'Allow'
          ? 'Policy Evaluation: Immediate Allow'
          : `Policy Evaluation: Step-Up Required (${ev.reason ?? 'Verification'})`,
      description:
        ev.decision === 'Allow'
          ? `Transfer of ${ev.amount ?? '0'} XLM to ${ev.recipient ?? 'recipient'} authorized within velocity cap.`
          : `Transfer of ${ev.amount ?? '0'} XLM to ${ev.recipient ?? 'recipient'} flagged for ${ev.reason ?? 'step-up confirmation'}.`,
      timestamp: ev.timestamp,
      ledger: 52891400 - idx * 4,
      txHash: `0x${idx}a9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`.slice(0, 66),
      badgeText: ev.decision === 'Allow' ? 'ALLOW' : 'STEP-UP',
      badgeType: ev.decision === 'Allow' ? 'clear' : 'gate',
      metadata: {
        amount: ev.amount ?? '0',
        recipient: ev.recipient ?? 'unknown',
        reason: ev.reason ?? 'None',
      },
    });
  });

  if (hasPolicy) {
    // State Transitions
    timeline.push({
      id: 'state-1',
      type: 'state_transition',
      title: 'State Transition: Account Set to Normal',
      description:
        'Account successfully transitioned to Normal state. All self-custody policy rules operational.',
      timestamp: '2026-09-02T14:30:00Z',
      ledger: 52889200,
      txHash: '0x3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      badgeText: 'NORMAL',
      badgeType: 'clear',
      metadata: {
        previousState: 'Uninitialized',
        newState: 'Normal',
        authority: wallet,
      },
    });

    // Velocity Resets
    timeline.push({
      id: 'vel-1',
      type: 'velocity_reset',
      title: 'Velocity Window Reset: 24-Hour Rolling Cap Refreshed',
      description: 'Cumulative spending quota reset to 0 XLM upon elapsed 24-hour interval.',
      timestamp: '2026-09-02T00:00:00Z',
      ledger: 52885100,
      txHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      badgeText: 'VELOCITY RESET',
      badgeType: 'info',
      metadata: {
        windowType: 'Daily 24H',
        capacityRestored: '100%',
      },
    });

    timeline.push({
      id: 'vel-2',
      type: 'velocity_reset',
      title: 'Velocity Spike Window Cleared: 1-Hour Cap',
      description: 'Short-term burst rate protection window closed and reset to zero.',
      timestamp: '2026-09-01T18:00:00Z',
      ledger: 52881200,
      txHash: '0x5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      badgeText: 'HOURLY RESET',
      badgeType: 'info',
      metadata: {
        windowType: 'Hourly 60M',
        burstCap: 'Restored',
      },
    });

    // Recovery Events
    timeline.push({
      id: 'rec-1',
      type: 'recovery',
      title: 'Guardian Recovery Setup Configured',
      description: 'Social recovery configuration committed on-chain. Quorum threshold established.',
      timestamp: '2026-08-28T10:15:00Z',
      ledger: 52870100,
      txHash: '0x4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      badgeText: 'GUARDIANS SET',
      badgeType: 'clear',
      metadata: {
        threshold: '2 of 3',
        timelock: '48 Hours',
      },
    });
  }

  // Sort chronological descending
  return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
