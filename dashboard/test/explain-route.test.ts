import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fallbackExplanation } from 'warden-sdk';
import { POST } from '@/app/api/explain/route';

const STEPUP_INPUT = { eventType: 'stepup_required', reason: 'AmountExceeded', amount: '200.00' };

function postRequest(body: unknown) {
  return new Request('http://localhost/api/explain', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockEvomapContent(content: string) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  }));
}

describe('/api/explain', () => {
  const originalKey = process.env.EVOMAP_API_KEY;

  beforeEach(() => {
    process.env.EVOMAP_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.EVOMAP_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it('falls back when EVOMAP_API_KEY is not configured, without ever calling fetch', async () => {
    delete process.env.EVOMAP_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.source).toBe('fallback');
    expect(result).toMatchObject(fallbackExplanation(STEPUP_INPUT as never));
  });

  it('rejects a malformed request body before ever building a prompt', async () => {
    const response = await POST(postRequest({ eventType: 'not_a_real_event' }));
    expect(response.status).toBe(400);
  });

  // Explicitly required by the spec: "Test explicitly: feed it a
  // fabricated/malformed model response and confirm the UI falls back
  // correctly rather than rendering it."
  it('falls back when Evomap returns non-JSON content', async () => {
    vi.stubGlobal('fetch', mockEvomapContent('not valid json at all'));

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
    expect(result).toMatchObject(fallbackExplanation(STEPUP_INPUT as never));
  });

  it('falls back when Evomap returns valid JSON that is missing a required field', async () => {
    vi.stubGlobal(
      'fetch',
      mockEvomapContent(JSON.stringify({ summary: 'ok', factors: ['a'] })), // missing next_steps
    );

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
  });

  it('falls back when Evomap returns extra, unexpected fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockEvomapContent(
        JSON.stringify({
          summary: 'ok',
          factors: ['a'],
          next_steps: ['b'],
          confidence: 0.99,
        }),
      ),
    );

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
  });

  // Explicitly required by the spec: "A response referencing a reason code
  // not present in the input is discarded, not rendered."
  it('discards a response that hallucinates a reason code not present in the input', async () => {
    vi.stubGlobal(
      'fetch',
      mockEvomapContent(
        JSON.stringify({
          summary: 'This was flagged as a FlaggedRecipient case.',
          factors: ['The recipient is on the flagged list.'],
          next_steps: ['Do not proceed.'],
        }),
      ),
    );

    // Input's real reason is AmountExceeded, not FlaggedRecipient.
    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
    expect(result).toMatchObject(fallbackExplanation(STEPUP_INPUT as never));
  });

  it('falls back when the Evomap request itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
  });

  it('falls back when fetch itself throws (network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('fallback');
  });

  it('renders the model output when it validates cleanly against the schema', async () => {
    vi.stubGlobal(
      'fetch',
      mockEvomapContent(
        JSON.stringify({
          summary: 'This amount is above your no-confirmation limit.',
          factors: ['200.00 exceeds your configured threshold.'],
          next_steps: ['Confirm if this is expected.'],
        }),
      ),
    );

    const response = await POST(postRequest(STEPUP_INPUT));
    const result = await response.json();

    expect(result.source).toBe('llm');
    expect(result.summary).toBe('This amount is above your no-confirmation limit.');
  });

  it('sends only the structured input to Evomap, never a wallet address or raw user data', async () => {
    const fetchSpy = mockEvomapContent(
      JSON.stringify({ summary: 'ok', factors: ['a'], next_steps: ['b'] }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    await POST(postRequest(STEPUP_INPUT));

    const [, requestInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(requestInit.body as string);
    const userMessage = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(JSON.parse(userMessage.content)).toEqual(STEPUP_INPUT);
  });
});
