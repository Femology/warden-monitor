# Security Policy

## Unaudited -- use at your own risk

**`warden-monitor` has not had a third-party security audit**, and neither has
[`warden-contract`](https://github.com/Femology/warden-contract), the system it
observes. This service is read-only by design (see the README's "one rule that governs
everything"), which meaningfully limits its blast radius, but it has not been
independently reviewed.

## A specific thing to check when reporting

**Any path, however indirect, by which this service could influence an allow/deny
decision is a critical-severity report**, not a normal bug -- that would quietly move
Warden's trust boundary off-chain, which defeats the entire reason the project exists.
This includes anything that could make the dashboard *look* like it has write access
even if it doesn't actually call a mutating contract function.

## Reporting a vulnerability

Report privately rather than opening a public issue.

**Contact:** femimi1234@gmail.com

Include a description, reproduction steps, and impact assessment. You'll get an
acknowledgment within a few days.

## Scope

In scope: `indexer/` and `dashboard/` in this repo. Out of scope: `@stellar/stellar-sdk`,
the Stellar network, and `warden-contract`'s own logic -- report contract issues to that
repo instead.
