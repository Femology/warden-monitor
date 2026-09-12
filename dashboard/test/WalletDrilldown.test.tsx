import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WalletDrilldown } from '@/components/WalletDrilldown';

const getPolicy = vi.fn();
const getVelocity = vi.fn();
const getWalletEvents = vi.fn();

vi.mock('@/lib/wardenClient', () => ({
  wardenClient: {
    getPolicy: (...args: unknown[]) => getPolicy(...args),
    getVelocity: (...args: unknown[]) => getVelocity(...args),
  },
}));

vi.mock('@/lib/api', () => ({
  getWalletEvents: (...args: unknown[]) => getWalletEvents(...args),
}));

describe('WalletDrilldown', () => {
  it('renders correctly for a wallet with no policy set, without erroring', async () => {
    getPolicy.mockResolvedValue(null);
    getVelocity.mockResolvedValue({ windowStart: BigInt(0), cumulativeAmount: '0', txCount: 0 });
    getWalletEvents.mockResolvedValue([]);

    render(<WalletDrilldown wallet="GNEWWALLET" />);

    await waitFor(() =>
      expect(screen.getByText(/has not configured a policy yet/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/no evaluations recorded for this wallet yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders policy details and history for a wallet with an active policy', async () => {
    getPolicy.mockResolvedValue({
      owner: 'GWALLET',
      maxNoStepUp: '150',
      dailyVelocityCap: '500',
      hourlyVelocityCap: '200',
      newRecipientRequiresStepUp: true,
      trustedRecipients: { GTRUSTED1: BigInt(1_700_000_000) },
      trustDecaySeconds: BigInt(2_592_000),
      updatedAt: BigInt(0),
    });
    getVelocity.mockResolvedValue({ windowStart: BigInt(0), cumulativeAmount: '75', txCount: 3 });
    getWalletEvents.mockResolvedValue([
      { recipient: 'GRECIPIENT', amount: '25', decision: 'Allow', reason: null, timestamp: '2026-09-01T00:00:00Z' },
    ]);

    render(<WalletDrilldown wallet="GWALLET" />);

    await waitFor(() => expect(screen.getByText('150')).toBeInTheDocument());
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    // Regression test for a real bug found during the Phase 14 upgrade:
    // trustedRecipients became a Record<address, last_paid_at>, and
    // `.length` on it type-checks (a string index signature covers every
    // key, "length" included) but silently renders `undefined` at runtime.
    // This asserts the actual entry count, not the property name.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('30 day(s)')).toBeInTheDocument();
    expect(screen.getByText('75 spent, 3 transfer(s)')).toBeInTheDocument();
  });

  it('shows a distinct error state when a live read fails', async () => {
    getPolicy.mockRejectedValue(new Error('RPC unreachable'));
    getVelocity.mockResolvedValue({ windowStart: BigInt(0), cumulativeAmount: '0', txCount: 0 });
    getWalletEvents.mockResolvedValue([]);

    render(<WalletDrilldown wallet="GWALLET" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('RPC unreachable'));
  });
});
