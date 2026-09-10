#!/usr/bin/env bash
set -euo pipefail

gh issue create \
  --title "chore(indexer): deploy to Render using render.yaml" \
  --label "enhancement,complexity: small" \
  --body "## Summary
render.yaml exists and is verified against Render's current Blueprint spec, but the
indexer isn't actually deployed yet -- this issue is doing that deploy and confirming
it stays running.

## Acceptance Criteria
- [ ] Connect this repo in the Render dashboard as a Blueprint.
- [ ] Fill in the \`sync: false\` env vars from DEPLOYMENT-INFO.md during Blueprint
      creation.
- [ ] Confirm the polling loop actually runs and indexes real events -- check
      \`/summary\` returns non-zero counts after warden-app generates some transactions.
- [ ] Trigger a redeploy and confirm indexed history survives it -- that's the actual
      test of whether the persistent disk is configured correctly, not just whether it
      deployed.

## Tech Stack
Render, render.yaml (already in this repo)."

gh issue create \
  --title "chore(dashboard): deploy to Vercel with a real public URL" \
  --label "enhancement,complexity: small" \
  --body "## Summary
The dashboard runs and is tested locally, but has no public URL. Depends on the
indexer (above) being deployed first, since \`NEXT_PUBLIC_INDEXER_URL\` needs a real
value.

## Acceptance Criteria
- [ ] Create a Vercel project connected to this repo, with \`dashboard\` as the root
      directory.
- [ ] Set every env var from HOSTING.md's dashboard table.
- [ ] Confirm the deployed dashboard shows real data from the deployed indexer, and
      that the wallet drill-down page's live reads actually work end to end.

## Tech Stack
Vercel, Next.js."

gh issue create \
  --title "feat(indexer): alert on the retention-window gap warning, not just log it" \
  --label "enhancement,complexity: medium" \
  --body "## Summary
The retention-window guard currently logs a loud \`console.warn\` when a real gap in
indexed history exists (verified with a dedicated test). In a real deployment, a log
line nobody is watching is not the same as being alerted -- this issue is wiring that
warning to something a human actually sees.

## Acceptance Criteria
- [ ] Pick a lightweight alerting mechanism appropriate for a small deployment (e.g. a
      webhook to Slack/Discord, or Render's own log-based alerting if it supports
      pattern matching).
- [ ] Fire the alert exactly once per gap occurrence, not once per poll cycle
      (currently would repeat every \`WARDEN_POLL_INTERVAL_MS\` until resolved).
- [ ] Document the alerting setup in README.md.

## Tech Stack
Node.js, whatever alerting destination is chosen."

echo "Done. Created 3 issues."
