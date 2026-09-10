# Contributing to warden-monitor

Thanks for looking at this. Contributions of any size are welcome.

## Before you start, the one rule that matters most

**This service has no write path to `warden-contract`, anywhere, in any component.** If
a change would let this service influence an allow/deny decision -- even indirectly,
even as a "just this once" convenience -- it's out of scope. See the README for why.

Other rules:
- **No `REAL`/float column or JS `number` for any monetary amount**, anywhere in this
  repo.
- **Current policy/velocity on the wallet drill-down page is always a live `warden-sdk`
  read**, never served from the indexer's cache.
- **The retention-window guard must warn, never silently show a gap as complete data.**
- Same design system as `warden-app` for the dashboard -- not a generic admin panel.

## Local setup

```bash
git clone https://github.com/Femology/warden-monitor.git
cd warden-monitor
npm install

cd indexer && npm test && cd ..
cd dashboard && npm test && cd ..
```

## Making a change

1. Open an issue first for anything beyond a trivial fix.
2. Branch from `main`.
3. One logical change per commit (`feat`, `fix`, `test`, `docs`, `chore`), scoped to
   `indexer` or `dashboard` in the commit message where relevant.
4. Both packages' tests must pass locally before you open a PR.
5. Open a PR against `main`. CI must pass, and the PR needs one approval before it can
   merge.

## Reporting a bug

Open an issue with what you expected, what happened, and which package (`indexer` or
`dashboard`) it's in. For a security issue, see `SECURITY.md` instead of a public issue.

## Code style

- `snake_case` in the SQL schema, `camelCase` in TypeScript -- don't let one leak into
  the other without an explicit mapping layer.
- Every polling cycle catches its own errors -- one bad cycle logs and retries, it never
  takes down the process.
