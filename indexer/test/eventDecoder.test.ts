import { describe, expect, it, vi } from 'vitest';

// scValToNative's real behavior was verified against live events emitted by
// the deployed warden-contract on Testnet (see DEPLOYMENT-INFO.md) -- this
// unit test covers decodeEvent's own field-mapping logic given already-
// decoded inputs, matching those verified real shapes exactly.
vi.mock('@stellar/stellar-sdk', () => ({
  scValToNative: (v: unknown) => v,
}));

const { decodeEvent } = await import('../src/eventDecoder.js');
import type { Api } from '@stellar/stellar-sdk/rpc';

function fakeEvent(
  topic: unknown[],
  value: unknown,
  overrides: Partial<Api.EventResponse> = {},
): Api.EventResponse {
  return {
    id: '1',
    type: 'contract',
    ledger: 100,
    ledgerClosedAt: '2026-01-01T00:00:00Z',
    transactionIndex: 0,
    operationIndex: 0,
    inSuccessfulContractCall: true,
    txHash: 'deadbeef',
    topic,
    value,
    ...overrides,
  } as unknown as Api.EventResponse;
}

describe('decodeEvent', () => {
  it('decodes policy_set with no recipient/amount/reason', () => {
    const row = decodeEvent(fakeEvent(['policy_set', 'GWALLET'], ['1000', '5000', true]));
    expect(row).toMatchObject({
      eventType: 'policy_set',
      wallet: 'GWALLET',
      recipient: null,
      amount: null,
      reason: null,
    });
  });

  it('decodes recipient_trusted with a bare recipient value', () => {
    const row = decodeEvent(fakeEvent(['recipient_trusted', 'GWALLET'], 'GRECIPIENT'));
    expect(row).toMatchObject({
      eventType: 'recipient_trusted',
      wallet: 'GWALLET',
      recipient: 'GRECIPIENT',
      amount: null,
      reason: null,
    });
  });

  it('decodes recipient_untrusted with a bare recipient value', () => {
    const row = decodeEvent(fakeEvent(['recipient_untrusted', 'GWALLET'], 'GRECIPIENT'));
    expect(row).toMatchObject({ eventType: 'recipient_untrusted', recipient: 'GRECIPIENT' });
  });

  it('decodes eval_allowed with recipient and amount', () => {
    const row = decodeEvent(fakeEvent(['eval_allowed', 'GWALLET'], ['GRECIPIENT', '250']));
    expect(row).toMatchObject({
      eventType: 'eval_allowed',
      recipient: 'GRECIPIENT',
      amount: '250',
      reason: null,
    });
  });

  it('decodes stepup_req, unwrapping the single-element reason array', () => {
    const row = decodeEvent(
      fakeEvent(['stepup_req', 'GWALLET'], ['GRECIPIENT', '9000', ['VelocityExceeded']]),
    );
    expect(row).toMatchObject({
      eventType: 'stepup_req',
      recipient: 'GRECIPIENT',
      amount: '9000',
      reason: 'VelocityExceeded',
    });
  });

  it('throws on an unrecognized topic', () => {
    expect(() => decodeEvent(fakeEvent(['unknown_event', 'GWALLET'], null))).toThrow(
      /Unrecognized/,
    );
  });

  it('carries through ledger, txHash, and createdAt unchanged', () => {
    const row = decodeEvent(
      fakeEvent(['policy_set', 'GWALLET'], ['1', '2', false], {
        ledger: 4598184,
        txHash: 'abc123',
        ledgerClosedAt: '2026-09-10T00:00:00Z',
      }),
    );
    expect(row.ledger).toBe(4598184);
    expect(row.txHash).toBe('abc123');
    expect(row.createdAt).toBe('2026-09-10T00:00:00Z');
  });
});
