<div align="center">

# Warden — Monitor

**Read-only observability for warden-contract: an indexer + dashboard that watches, and
can never decide.**

[![CI](https://github.com/wardenoss/warden-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/wardenoss/warden-monitor/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Network](https://img.shields.io/badge/network-Stellar%20Testnet-7D00FF)](https://stellar.expert/explorer/testnet/contract/CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW)

[Warden org](https://github.com/wardenoss) · [warden-contract](https://github.com/wardenoss/warden-contract) · [warden-sdk](https://github.com/wardenoss/warden-sdk) · [warden-app](https://github.com/wardenoss/warden-app) · [Discussions](https://github.com/wardenoss/warden-monitor/discussions)

</div>

---


Read-only observability for [Warden](https://github.com/wardenoss/warden-contract): an
indexer that polls `warden-contract`'s on-chain events, plus a dashboard showing how
often step-up triggers, on which reasons, and how a given wallet is running against its
own policy and velocity cap.

## The one rule that governs everything here

**This service has no write path to `warden-contract`, anywhere.** The indexer only
ever calls `getEvents` (read) against Soroban RPC; every HTTP route it exposes is a
`GET` against its own SQLite cache. The dashboard's wallet drill-down page reads
current policy and velocity live through `warden-sdk` on every load -- never from the
indexer's cache; only the historical evaluation list comes from there.

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

Soroban RPC only retains events for a limited recent ledger range, which varies by
provider. If the indexer's last-processed ledger ages out of what the RPC still
serves, a real gap exists in this index's history -- the poller detects this on every
cycle and logs a `RETENTION GAP` warning rather than silently resuming with a hole in
the record. A production deployment should alert on that log line.

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
| `EVOMAP_API_KEY` | dashboard | **Server-only, optional.** Powers "Explain this" on the drill-down page; falls back to pre-written explanations if unset. |

---

## Maintainers

| Name | GitHub | Contact |
|---|---|---|
| Femology | [@Femology](https://github.com/Femology) | femimi1234@gmail.com |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Found a security issue? See
[SECURITY.md](SECURITY.md) instead of opening a public issue.

<a href="https://github.com/wardenoss/warden-monitor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=wardenoss/warden-monitor" alt="Contributors" />
</a>
