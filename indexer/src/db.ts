import { DatabaseSync } from 'node:sqlite';

export interface EventRow {
  ledger: number;
  txHash: string;
  eventType: string;
  wallet: string;
  recipient: string | null;
  amount: string | null;
  reason: string | null;
  createdAt: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ledger INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  event_type TEXT NOT NULL,
  wallet TEXT NOT NULL,
  recipient TEXT,
  amount TEXT,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_wallet ON events(wallet);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

CREATE TABLE IF NOT EXISTS indexer_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_processed_ledger INTEGER NOT NULL
);
`;

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

export function getLastProcessedLedger(db: DatabaseSync): number | null {
  const row = db.prepare('SELECT last_processed_ledger FROM indexer_state WHERE id = 1').get() as
    | { last_processed_ledger: number }
    | undefined;
  return row ? row.last_processed_ledger : null;
}

/**
 * Inserts a batch of events and updates last_processed_ledger in the same
 * transaction, so a crash mid-cycle can never leave the two out of sync.
 */
export function insertEventsAndAdvance(
  db: DatabaseSync,
  events: EventRow[],
  newLastProcessedLedger: number,
): void {
  const insert = db.prepare(
    `INSERT INTO events (ledger, tx_hash, event_type, wallet, recipient, amount, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const upsertState = db.prepare(
    `INSERT INTO indexer_state (id, last_processed_ledger) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET last_processed_ledger = excluded.last_processed_ledger`,
  );

  db.exec('BEGIN');
  try {
    for (const event of events) {
      insert.run(
        event.ledger,
        event.txHash,
        event.eventType,
        event.wallet,
        event.recipient,
        event.amount,
        event.reason,
        event.createdAt,
      );
    }
    upsertState.run(newLastProcessedLedger);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
