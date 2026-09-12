import { NextResponse } from 'next/server';
import { buildExplainPrompt, fallbackExplanation, validateExplanationResponse } from 'warden-sdk';
import type { ExplanationInput, ExplanationResult } from 'warden-sdk';

/**
 * Phase 18 -- "Explain this". Server-only: EVOMAP_API_KEY is read here and
 * nowhere else, never sent to the browser. The model sees ONLY the
 * structured on-chain facts in `input` (see ExplanationInput in
 * warden-sdk) -- no wallet address, no other history, no ability to call
 * back into any Warden function, no ability to change anything. Every
 * response is validated against the fixed schema before being trusted; any
 * deviation (malformed shape, a reason code the input never mentioned, a
 * network failure, a missing key) falls back to a pre-written explanation
 * instead of rendering anything ungrounded.
 */

const EVOMAP_BASE_URL = 'https://api.evomap.ai/v1';
const EVOMAP_MODEL = 'evomap-deepseek-v4-flash';

function isValidInput(value: unknown): value is ExplanationInput {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.eventType === 'stepup_required') {
    return typeof obj.reason === 'string' && typeof obj.amount === 'string';
  }
  if (obj.eventType === 'state_transition') {
    return typeof obj.previousState === 'string' && typeof obj.newState === 'string';
  }
  return false;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toResult(
  explanation: ReturnType<typeof fallbackExplanation>,
  source: ExplanationResult['source'],
): ExplanationResult {
  return { ...explanation, source };
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  if (!isValidInput(input)) {
    return NextResponse.json({ error: 'Malformed explanation input.' }, { status: 400 });
  }

  const apiKey = process.env.EVOMAP_API_KEY;
  if (!apiKey) {
    // No key configured -- an expected state during setup, not an error.
    // The feature still works, just always via the pre-written copy.
    return NextResponse.json(toResult(fallbackExplanation(input), 'fallback'));
  }

  try {
    const { system, user } = buildExplainPrompt(input);
    const response = await fetch(`${EVOMAP_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EVOMAP_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Evomap request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;
    const parsed = typeof rawContent === 'string' ? safeJsonParse(rawContent) : undefined;
    const validated = parsed === undefined ? null : validateExplanationResponse(parsed, input);

    if (validated) {
      return NextResponse.json(toResult(validated, 'llm'));
    }
    // Schema mismatch or an ungrounded reason code -- discard, don't render.
    return NextResponse.json(toResult(fallbackExplanation(input), 'fallback'));
  } catch {
    // Network error, timeout, non-JSON body -- this is an optional
    // explanatory feature, never worth a 500 to the caller.
    return NextResponse.json(toResult(fallbackExplanation(input), 'fallback'));
  }
}
