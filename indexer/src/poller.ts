import type { rpc } from '@stellar/stellar-sdk';
import type { DatabaseSync } from 'node:sqlite';
import { CONFIG } from './config.js';
import { getLastProcessedLedger, insertEventsAndAdvance } from './db.js';
import { decodeEvent } from './eventDecoder.js';

const PAGE_LIMIT = 100;

function eventFilter() {
  return [{ type: 'contract' as const, contractIds: [CONFIG.contractId] }];
}

/**
 * Runs one polling cycle: resumes from indexer_state (or the contract's
 * deploy ledger on first run), fetches every page of new events via
 * getEvents' cursor pagination (verified against the real
 * GetEventsRequest/Response shape -- a full page always means "there may be
 * more", a short page means "caught up"), decodes them, and commits rows +
 * the new last_processed_ledger atomically.
 *
 * Retention-window guard: if the ledger we wanted to resume from has
 * already aged out of what the RPC retains, this warns loudly rather than
 * silently indexing from wherever the RPC happens to start -- a real gap in
 * history must never be presented as complete data.
 */
export async function pollOnce(db: DatabaseSync, server: rpc.Server): Promise<void> {
  const lastProcessed = getLastProcessedLedger(db) ?? CONFIG.deployLedger - 1;
  const startLedger = lastProcessed + 1;

  let response = await server.getEvents({
    filters: eventFilter(),
    startLedger,
    limit: PAGE_LIMIT,
  });

  if (startLedger < response.oldestLedger) {
    console.warn(
      `[warden-monitor] RETENTION GAP: wanted to resume from ledger ${startLedger}, ` +
        `but this RPC endpoint only retains events from ${response.oldestLedger} onward. ` +
        `History between those ledgers is permanently missing from this index -- ` +
        `it must be surfaced as a gap, never presented as complete.`,
    );
  }

  const collected = [...response.events];
  while (response.events.length === PAGE_LIMIT) {
    response = await server.getEvents({
      filters: eventFilter(),
      cursor: response.cursor,
      limit: PAGE_LIMIT,
    });
    collected.push(...response.events);
  }

  if (collected.length === 0) {
    // Nothing new. Still safe to advance to the latest known ledger so we
    // don't needlessly rescan an empty range next cycle.
    insertEventsAndAdvance(db, [], Math.max(response.latestLedger, lastProcessed));
    return;
  }

  const rows = collected.map(decodeEvent);
  insertEventsAndAdvance(db, rows, response.latestLedger);
}

/**
 * Runs pollOnce on an interval. One bad cycle (RPC error, decode error on a
 * malformed event) is logged and retried next cycle -- it never crashes the
 * process.
 */
export function startPolling(db: DatabaseSync, server: rpc.Server): NodeJS.Timeout {
  return setInterval(() => {
    pollOnce(db, server).catch((error) => {
      console.error('[warden-monitor] poll cycle failed, will retry next interval:', error);
    });
  }, CONFIG.pollIntervalMs);
}
