# Hosting topology

Four deployable pieces across two platforms, chosen for what each actually is: `warden-app`
and the dashboard are stateless Next.js frontends (Vercel); the indexer is a
long-running stateful process with a database (Render) -- not something a serverless
platform is built for.

## Topology

```
user
 │
 ├──► warden-app (Vercel)
 │      └──► Stellar Soroban RPC (Testnet) -- direct, for every read AND write
 │           (evaluate, set_policy, trusted recipients, the SEP-41 transfer)
 │
 └──► warden-monitor dashboard (Vercel)
        ├──► indexer API (Render) -- historical / aggregate reads only
        │      └──► SQLite on a persistent disk (/data)
        │             ▲
        │             │ polls getEvents, writes rows
        │             │
        │      warden-monitor indexer (Render, same service) ──► Stellar Soroban RPC
        │
        └──► Stellar Soroban RPC (Testnet) -- direct, client-side via warden-sdk,
             for the wallet drill-down page's CURRENT policy/velocity only
```

**warden-app talks to Stellar RPC directly** for every read and write (`evaluate`,
`set_policy`, `add_trusted_recipient`, the SEP-41 transfer) -- it never goes through the
indexer. **The dashboard talks to two different things on purpose**: the indexer's HTTP
API for historical/aggregate data, and Stellar RPC directly (via `warden-sdk`, client-side)
for the wallet drill-down page's *current* policy and velocity. Mixing those up would let
the dashboard show a policy as it was several minutes ago and call it current -- see
`README.md`'s read-only guarantee section.

## Platform assignments

| Piece | Platform | Why |
|---|---|---|
| `warden-app` | Vercel | Stateless Next.js frontend |
| `warden-monitor` dashboard | Vercel | Stateless Next.js frontend |
| `warden-monitor` indexer | Render (`render.yaml`) | Long-running process + persistent disk -- not serverless-shaped |

## Environment variables

Every value below traces back to `DEPLOYMENT-INFO.md`'s captured Phase 8 env block --
same names, same values, no drift.

### `warden-app` (Vercel)

| Variable | Value source |
|---|---|
| `NEXT_PUBLIC_WARDEN_NETWORK` | `WARDEN_NETWORK` |
| `NEXT_PUBLIC_WARDEN_RPC_URL` | `WARDEN_RPC_URL` |
| `NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE` | `WARDEN_NETWORK_PASSPHRASE` |
| `NEXT_PUBLIC_WARDEN_CONTRACT_ID` | `WARDEN_CONTRACT_ID` |
| `NEXT_PUBLIC_WARDEN_REFERENCE_ASSET` | `WARDEN_REFERENCE_ASSET` |
| `NEXT_PUBLIC_WARDEN_WALLET_WASM_HASH` | passkey-kit smart-wallet wasm hash |
| `NEXT_PUBLIC_WARDEN_DEPLOYER_PUBLIC_KEY` | `WARDEN_ADMIN_ADDRESS` (the deployer's public key) |
| `WARDEN_DEPLOYER_SECRET` | **Server-only.** The deployer's secret key. Never prefix this with `NEXT_PUBLIC_` -- doing so would ship it to every browser. |

### `warden-monitor` dashboard (Vercel)

| Variable | Value source |
|---|---|
| `NEXT_PUBLIC_INDEXER_URL` | The Render indexer's public URL (`https://warden-monitor-indexer.onrender.com` or your custom domain) |
| `NEXT_PUBLIC_WARDEN_CONTRACT_ID` | `WARDEN_CONTRACT_ID` |
| `NEXT_PUBLIC_WARDEN_RPC_URL` | `WARDEN_RPC_URL` |
| `NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE` | `WARDEN_NETWORK_PASSPHRASE` |

### `warden-monitor` indexer (Render, via `render.yaml`)

| Variable | Value source |
|---|---|
| `WARDEN_CONTRACT_ID` | `WARDEN_CONTRACT_ID` |
| `WARDEN_RPC_URL` | `WARDEN_RPC_URL` |
| `WARDEN_NETWORK_PASSPHRASE` | `WARDEN_NETWORK_PASSPHRASE` |
| `WARDEN_DEPLOY_LEDGER` | `WARDEN_DEPLOY_LEDGER` -- the indexer's starting point; wrong or missing, it either rescans from genesis or misses early events |
| `WARDEN_POLL_INTERVAL_MS` | Operational tunable, not contract-identifying -- committed directly in `render.yaml` as `10000` |
| `DB_PATH` | `/data/warden-monitor.db` -- must point inside `disk.mountPath` from `render.yaml`, or every redeploy loses all indexed history |
| `PORT` | Injected automatically by Render -- do not set manually |

None of `render.yaml`, `warden-app`'s config, or the dashboard's config hardcode a
contract ID, RPC URL, or secret -- every one of those is an environment variable
reference, filled in per-platform at deploy time.

## The NEXT_PUBLIC_ build-time trap

**`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at build time, not
read at runtime.** Changing one in the Vercel dashboard and clicking "Restart" does
nothing -- the already-built bundle still contains the old value baked in. The fix is a
new build: either redeploy, or use Vercel's "Redeploy" action (not a server restart).

This is worth guarding against explicitly because it fails silently and confusingly: the
app keeps running, keeps looking healthy, and keeps calling the *old* contract ID or RPC
URL with no error indicating why. If `warden-app` or the dashboard ever seem to be
"stuck" on a stale contract ID or RPC URL after an env var change, this is almost always
the cause -- check the deployment's build time against when the env var actually
changed, not just whether the service is "up."

`WARDEN_DEPLOYER_SECRET` and the indexer's server-only env vars don't have this problem
-- Node process env vars are read at request time, so a Render restart alone does pick
up a changed value there.
