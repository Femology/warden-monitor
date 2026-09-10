import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import { openDb } from '../src/db.js';
import { createHttpServer } from '../src/routes.js';

function seed(db: ReturnType<typeof openDb>) {
  const insert = db.prepare(
    `INSERT INTO events (ledger, tx_hash, event_type, wallet, recipient, amount, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insert.run(100, 't1', 'eval_allowed', 'GWALLET', 'GRECIPIENT1', '50', null, '2026-09-01T00:00:00Z');
  insert.run(101, 't2', 'stepup_req', 'GWALLET', 'GRECIPIENT2', '2000', 'AmountExceeded', '2026-09-02T00:00:00Z');
  insert.run(102, 't3', 'stepup_req', 'GWALLET', 'GRECIPIENT3', '10', 'NewRecipient', '2026-09-02T00:00:00Z');
  insert.run(103, 't4', 'policy_set', 'GWALLET', null, null, null, '2026-09-01T00:00:00Z');
}

describe('indexer HTTP endpoints', () => {
  let server: ReturnType<typeof createHttpServer>;
  let baseUrl: string;
  let db: ReturnType<typeof openDb>;

  beforeEach(async () => {
    db = openDb(':memory:');
    seed(db);
    server = createHttpServer(db);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  it('GET /summary returns correct totals and reason breakdown', async () => {
    const res = await fetch(`${baseUrl}/summary`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      totalEvaluations: 3,
      totalAllowed: 1,
      totalStepUp: 2,
      byReason: { amountExceeded: 1, newRecipient: 1, velocityExceeded: 0 },
    });
  });

  it('GET /timeseries returns per-day allowed/stepUp counts', async () => {
    const res = await fetch(`${baseUrl}/timeseries?days=30`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { date: string; allowed: number; stepUp: number }[];
    const sep2 = body.find((row) => row.date === '2026-09-02');
    expect(sep2).toMatchObject({ allowed: 0, stepUp: 2 });
  });

  it('GET /wallet/:address/events returns that wallet\'s decision history', async () => {
    const res = await fetch(`${baseUrl}/wallet/GWALLET/events?limit=50`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(3);
    expect(body[0]).toMatchObject({ recipient: 'GRECIPIENT3', decision: 'RequireStepUp', reason: 'NewRecipient' });
  });

  it('rejects non-GET methods on every route', async () => {
    const res = await fetch(`${baseUrl}/summary`, { method: 'POST' });
    expect(res.status).toBe(405);
  });

  it('returns 404 for an unknown path', async () => {
    const res = await fetch(`${baseUrl}/not-a-real-route`);
    expect(res.status).toBe(404);
  });
});
