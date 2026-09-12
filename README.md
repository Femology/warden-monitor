<div align="center">

# Warden — Monitor

**Read-only observability for warden-contract: an indexer + dashboard that watches, and
can never decide.**

[![CI](https://github.com/Femology/warden-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/Femology/warden-monitor/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Network](https://img.shields.io/badge/network-Stellar%20Testnet-7D00FF)](https://stellar.expert/explorer/testnet/contract/CD25U7GYDNB7XUBEEN3OKZK2LY62ANSUJJPQ6SF2Y6DHQ5SQ3F7LSVUF)

[Warden org](https://github.com/Femology) · [warden-contract](https://github.com/Femology/warden-contract) · [warden-sdk](https://github.com/Femology/warden-sdk) · [warden-app](https://github.com/Femology/warden-app) · [Discussions](https://github.com/Femology/warden-monitor/discussions)

</div>

---


Read-only observability for [Warden](https://github.com/Femology/warden-contract): an
indexer that polls `warden-contract`'s on-chain events, plus a dashboard showing how
often step-up triggers, on which reasons, and how a given wallet is running against its
own policy and velocity cap.

## The one rule that governs everything here

**This service has no write path to `warden-contract`, anywhere, in any component.**
Confirmed explicitly:

- No endpoint or code path in `indexer/` ever calls a mutating contract function --
  only `getEvents` (read) against Soroban RPC. Every HTTP route it exposes
  (`/summary`, `/timeseries`, `/wallet/:address/events`) is a `GET` reading from its own
  SQLite cache; anything else returns `405`.
- The dashboard's wallet drill-down page reads **current policy and current velocity
  live, every time, through `warden-sdk`** (`wardenClient.getPolicy` /
  `wardenClient.getVelocity`) -- never from the indexer's cache. Only the *historical*
  evaluation list on that page comes from the indexer.
- The retention-window guard (`indexer/src/poller.ts`) checks the wanted resume ledger
  against the RPC's own `oldestLedger` on every poll cycle and **logs a loud warning**
  when a gap exists -- it never silently presents partial history as complete.

## Architecture

```
indexer/    Node.js + TypeScript, node:sqlite, plain node:http
  src/config.ts       -- contract id, rpc url, poll interval, db path
  src/db.ts           -- schema + insert/read helpers (events, indexer_state)
  src/eventDecoder.ts -- decodes all 5 warden-contract event types
  src/poller.ts        -- getEvents polling loop, cursor pagination, retention guard
  src/queries.ts       -- summary / timeseries / per-wallet query logic
  src/routes.ts         -- the three read-only HTTP endpoints
  src/index.ts          -- entrypoint wiring db + poller + http server

dashboard/  Next.js + Tailwind, same design system as warden-app
  src/lib/api.ts          -- fetches from the indexer's HTTP endpoints
  src/lib/wardenClient.ts -- warden-sdk, for live (not historical) reads
  src/components/         -- SummaryCards, ReasonBreakdownChart, StepUpRateChart,
                              WalletDrilldown
```

## API

- `GET /summary` -> `{ totalEvaluations, totalAllowed, totalStepUp, byReason: { amountExceeded, newRecipient, velocityExceeded } }`
- `GET /timeseries?days=30` -> `[{ date, allowed, stepUp }]`
- `GET /wallet/:address/events?limit=50` -> `[{ recipient, amount, decision, reason, timestamp }]`

No other endpoints exist.

## Known limitation: RPC event retention

Soroban RPC only retains events for a limited recent ledger range -- this varies by
provider and changes over time. If the indexer's `last_processed_ledger` has aged out of
what the connected RPC endpoint still serves, a real, permanent gap exists in this
index's history. The poller detects this on every cycle and logs it loudly
(`RETENTION GAP` in the indexer's logs) rather than quietly resuming from wherever the
RPC happens to start. This is a stated v1 limitation, not a bug -- a production
deployment should alert on that log line.

## Local setup

```bash
npm install

# Terminal 1 -- indexer (polls RPC, serves the three endpoints on :4000)
cd indexer && npm run dev

# Terminal 2 -- dashboard (reads from the indexer + live warden-sdk reads)
cd dashboard && npm run dev
```

### Environment variables

| Variable | Package | Purpose |
|---|---|---|
| `WARDEN_CONTRACT_ID` | indexer | Deployed `warden-contract` address |
| `WARDEN_RPC_URL` | indexer | Soroban RPC endpoint |
| `WARDEN_DEPLOY_LEDGER` | indexer | Starting point for the very first poll cycle |
| `WARDEN_POLL_INTERVAL_MS` | indexer | Default `10000` |
| `DB_PATH` | indexer | SQLite file path -- must be on a persistent disk in any real deployment, or all indexed history is lost on every redeploy |
| `PORT` | indexer | HTTP port, default `4000` |
| `NEXT_PUBLIC_INDEXER_URL` | dashboard | Where the indexer's API is reachable from the dashboard |
| `NEXT_PUBLIC_WARDEN_CONTRACT_ID`, `NEXT_PUBLIC_WARDEN_RPC_URL`, `NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE` | dashboard | For the live `warden-sdk` reads on the drill-down page |

---

## Maintainers

| Name | GitHub | Contact |
|---|---|---|
| Femology | [@Femology](https://github.com/Femology) | femimi1234@gmail.com |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Found a security issue? See
[SECURITY.md](SECURITY.md) instead of opening a public issue.

<a href="https://github.com/Femology/warden-monitor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Femology/warden-monitor" alt="Contributors" />
</a>
