'use client';

import { useState } from 'react';
import { fallbackExplanation } from 'warden-sdk';
import type { ExplanationInput, ExplanationResult } from 'warden-sdk';

interface ExplainButtonProps {
  input: ExplanationInput;
}

/**
 * Phase 18 -- "Explain this". Sends ONLY `input` (the structured on-chain
 * facts for one event) to the server route, which is the only place that
 * ever touches the model API key. If the route itself is unreachable, not
 * just a bad response -- the route already falls back for that -- this
 * computes fallbackExplanation() locally too, since it's pure, secret-free
 * logic re-exported from warden-sdk for exactly this reason.
 */
export function ExplainButton({ input }: ExplainButtonProps) {
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [explaining, setExplaining] = useState(false);

  async function handleExplain() {
    setExplaining(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('explain route failed');
      const result = (await response.json()) as ExplanationResult;
      setExplanation(result);
    } catch {
      setExplanation({ ...fallbackExplanation(input), source: 'fallback' });
    } finally {
      setExplaining(false);
    }
  }

  if (explanation) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-ink-700 bg-ink-900 p-3 text-sm">
        <p className="text-mist-100">{explanation.summary}</p>
        {explanation.factors.length > 0 && (
          <ul className="flex flex-col gap-1 text-mist-400">
            {explanation.factors.map((factor, index) => (
              <li key={index}>• {factor}</li>
            ))}
          </ul>
        )}
        {explanation.nextSteps.length > 0 && (
          <ul className="flex flex-col gap-1 text-mist-400">
            {explanation.nextSteps.map((step, index) => (
              <li key={index}>• {step}</li>
            ))}
          </ul>
        )}
        <span className="text-xs text-mist-400">
          {explanation.source === 'llm' ? 'AI-generated, grounded in this event only' : 'Standard explanation'}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExplain}
      disabled={explaining}
      className="self-start text-xs text-mist-400 underline decoration-dotted hover:text-mist-100 disabled:opacity-50"
    >
      {explaining ? 'Explaining…' : 'Explain this'}
    </button>
  );
}
