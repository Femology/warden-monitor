import { scValToNative } from '@stellar/stellar-sdk';
import type { Api } from '@stellar/stellar-sdk/rpc';
import type { EventRow } from './db.js';

/**
 * Decodes one raw getEvents() event into a flat row for the events table.
 * Verified against real events emitted by the deployed warden-contract
 * (not assumed from the Rust source alone) -- notably: amounts decode to
 * decimal strings already (never a JS number), and a unit-variant enum like
 * StepUpReason decodes as a single-element array containing the variant
 * name, e.g. ["NewRecipient"].
 */
export function decodeEvent(event: Api.EventResponse): EventRow {
  const topics = event.topic.map((t) => scValToNative(t));
  const eventType = topics[0] as string;
  const wallet = topics[1] as string;
  const value = scValToNative(event.value);

  let recipient: string | null = null;
  let amount: string | null = null;
  let reason: string | null = null;

  switch (eventType) {
    case 'policy_set':
      // No recipient/amount/reason for this event -- policy field values are
      // never persisted here; the dashboard always reads current policy live
      // via warden-sdk, never from this cache.
      break;

    case 'recipient_trusted':
    case 'recipient_untrusted':
      recipient = value as string;
      break;

    case 'eval_allowed': {
      const [decodedRecipient, decodedAmount] = value as [string, string];
      recipient = decodedRecipient;
      amount = decodedAmount;
      break;
    }

    case 'stepup_req': {
      const [decodedRecipient, decodedAmount, decodedReason] = value as [
        string,
        string,
        string[],
      ];
      recipient = decodedRecipient;
      amount = decodedAmount;
      reason = Array.isArray(decodedReason) ? (decodedReason[0] ?? null) : String(decodedReason);
      break;
    }

    default:
      throw new Error(`Unrecognized warden event topic: "${eventType}"`);
  }

  return {
    ledger: event.ledger,
    txHash: event.txHash,
    eventType,
    wallet,
    recipient,
    amount,
    reason,
    createdAt: event.ledgerClosedAt,
  };
}
