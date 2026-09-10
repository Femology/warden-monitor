import type { DatabaseSync } from 'node:sqlite';

export interface Summary {
  totalEvaluations: number;
  totalAllowed: number;
  totalStepUp: number;
  byReason: {
    amountExceeded: number;
    newRecipient: number;
    velocityExceeded: number;
  };
}

export function getSummary(db: DatabaseSync): Summary {
  const allowed = (
    db.prepare("SELECT COUNT(*) as n FROM events WHERE event_type = 'eval_allowed'").get() as {
      n: number;
    }
  ).n;
  const stepUp = (
    db.prepare("SELECT COUNT(*) as n FROM events WHERE event_type = 'stepup_req'").get() as {
      n: number;
    }
  ).n;

  const byReasonRows = db
    .prepare("SELECT reason, COUNT(*) as n FROM events WHERE event_type = 'stepup_req' GROUP BY reason")
    .all() as { reason: string; n: number }[];

  const byReason = { amountExceeded: 0, newRecipient: 0, velocityExceeded: 0 };
  for (const row of byReasonRows) {
    if (row.reason === 'AmountExceeded') byReason.amountExceeded = row.n;
    else if (row.reason === 'NewRecipient') byReason.newRecipient = row.n;
    else if (row.reason === 'VelocityExceeded') byReason.velocityExceeded = row.n;
  }

  return { totalEvaluations: allowed + stepUp, totalAllowed: allowed, totalStepUp: stepUp, byReason };
}

export interface TimeseriesPoint {
  date: string;
  allowed: number;
  stepUp: number;
}

export function getTimeseries(db: DatabaseSync, days: number): TimeseriesPoint[] {
  const rows = db
    .prepare(
      `SELECT
         date(created_at) as date,
         SUM(CASE WHEN event_type = 'eval_allowed' THEN 1 ELSE 0 END) as allowed,
         SUM(CASE WHEN event_type = 'stepup_req' THEN 1 ELSE 0 END) as stepUp
       FROM events
       WHERE event_type IN ('eval_allowed', 'stepup_req')
         AND date(created_at) >= date('now', ?)
       GROUP BY date(created_at)
       ORDER BY date(created_at)`,
    )
    .all(`-${days} days`) as { date: string; allowed: number; stepUp: number }[];
  return rows;
}

export interface WalletEvent {
  recipient: string | null;
  amount: string | null;
  decision: 'Allow' | 'RequireStepUp';
  reason: string | null;
  timestamp: string;
}

export function getWalletEvents(db: DatabaseSync, wallet: string, limit: number): WalletEvent[] {
  const rows = db
    .prepare(
      `SELECT recipient, amount, event_type, reason, created_at
       FROM events
       WHERE wallet = ? AND event_type IN ('eval_allowed', 'stepup_req')
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(wallet, limit) as {
    recipient: string | null;
    amount: string | null;
    event_type: string;
    reason: string | null;
    created_at: string;
  }[];

  return rows.map((row) => ({
    recipient: row.recipient,
    amount: row.amount,
    decision: row.event_type === 'eval_allowed' ? 'Allow' : 'RequireStepUp',
    reason: row.reason,
    timestamp: row.created_at,
  }));
}
