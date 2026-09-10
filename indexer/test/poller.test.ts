import { describe, expect, it, vi, beforeEach } from 'vitest';
import { openDb, getLastProcessedLedger } from '../src/db.js';
import { pollOnce } from '../src/poller.js';

vi.mock('@stellar/stellar-sdk', () => ({
  scValToNative: (v: unknown) => v,
}));

function fakeEvent(ledger: number, txHash: string) {
  return {
    id: `${ledger}-0`,
    type: 'contract',
    ledger,
    ledgerClosedAt: '2026-01-01T00:00:00Z',
    transactionIndex: 0,
    operationIndex: 0,
    inSuccessfulContractCall: true,
    txHash,
    topic: ['recipient_trusted', 'GWALLET'],
    value: 'GRECIPIENT',
  };
}

describe('pollOnce', () => {
  let db: ReturnType<typeof openDb>;

  beforeEach(() => {
    db = openDb(':memory:');
  });

  it('resumes from the deploy ledger on first run and persists last_processed_ledger', async () => {
    const getEvents = vi.fn().mockResolvedValue({
      events: [fakeEvent(4598200, 'tx1')],
      cursor: 'c1',
      latestLedger: 4598300,
      oldestLedger: 4000000,
      latestLedgerCloseTime: '',
      oldestLedgerCloseTime: '',
    });
    const server = { getEvents } as unknown as import('@stellar/stellar-sdk').rpc.Server;

    await pollOnce(db, server);

    expect(getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ startLedger: expect.any(Number) }),
    );
    const row = db.prepare('SELECT * FROM events').get() as { tx_hash: string };
    expect(row.tx_hash).toBe('tx1');
    expect(getLastProcessedLedger(db)).toBe(4598300);
  });

  it('resumes from last_processed_ledger + 1 on a second call, not from the deploy ledger again', async () => {
    const getEvents = vi
      .fn()
      .mockResolvedValueOnce({
        events: [fakeEvent(4598200, 'tx1')],
        cursor: 'c1',
        latestLedger: 4598300,
        oldestLedger: 4000000,
        latestLedgerCloseTime: '',
        oldestLedgerCloseTime: '',
      })
      .mockResolvedValueOnce({
        events: [fakeEvent(4598400, 'tx2')],
        cursor: 'c2',
        latestLedger: 4598500,
        oldestLedger: 4000000,
        latestLedgerCloseTime: '',
        oldestLedgerCloseTime: '',
      });
    const server = { getEvents } as unknown as import('@stellar/stellar-sdk').rpc.Server;

    await pollOnce(db, server);
    await pollOnce(db, server);

    expect(getEvents.mock.calls[1]?.[0]).toMatchObject({ startLedger: 4598301 });
    const rows = db.prepare('SELECT tx_hash FROM events ORDER BY id').all() as {
      tx_hash: string;
    }[];
    expect(rows.map((r) => r.tx_hash)).toEqual(['tx1', 'tx2']);
    expect(getLastProcessedLedger(db)).toBe(4598500);
  });

  it('follows cursor pagination across multiple full pages', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => fakeEvent(4598200 + i, `full-${i}`));
    const shortPage = [fakeEvent(4598500, 'last')];
    const getEvents = vi
      .fn()
      .mockResolvedValueOnce({
        events: fullPage,
        cursor: 'c1',
        latestLedger: 4598600,
        oldestLedger: 4000000,
        latestLedgerCloseTime: '',
        oldestLedgerCloseTime: '',
      })
      .mockResolvedValueOnce({
        events: shortPage,
        cursor: 'c2',
        latestLedger: 4598600,
        oldestLedger: 4000000,
        latestLedgerCloseTime: '',
        oldestLedgerCloseTime: '',
      });
    const server = { getEvents } as unknown as import('@stellar/stellar-sdk').rpc.Server;

    await pollOnce(db, server);

    expect(getEvents).toHaveBeenCalledTimes(2);
    expect(getEvents.mock.calls[1]?.[0]).toMatchObject({ cursor: 'c1' });
    const count = db.prepare('SELECT COUNT(*) as n FROM events').get() as { n: number };
    expect(count.n).toBe(101);
  });

  it('warns loudly when the wanted ledger has aged out of RPC retention', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getEvents = vi.fn().mockResolvedValue({
      events: [],
      cursor: 'c1',
      latestLedger: 5000000,
      oldestLedger: 4999000,
      latestLedgerCloseTime: '',
      oldestLedgerCloseTime: '',
    });
    const server = { getEvents } as unknown as import('@stellar/stellar-sdk').rpc.Server;

    await pollOnce(db, server);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('RETENTION GAP'));
    warnSpy.mockRestore();
  });

  it('does not crash and simply logs when a poll cycle throws', async () => {
    const { startPolling } = await import('../src/poller.js');
    const getEvents = vi.fn().mockRejectedValue(new Error('RPC unreachable'));
    const server = { getEvents } as unknown as import('@stellar/stellar-sdk').rpc.Server;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.useFakeTimers();
    const handle = startPolling(db, server);
    await vi.advanceTimersByTimeAsync(10_000);
    clearInterval(handle);
    vi.useRealTimers();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
