# Vercel Deployment Baseline

## Goal

This file records the current Vercel deployment posture for the root Next.js app and the assumptions that still matter before cutover.

## Checked-In Configuration

- `vercel.json` explicitly sets `framework` to `nextjs`
- `vercel.json` uses `npm ci` for deterministic installs
- `vercel.json` registers a cron job for `/api/cron/prune-expired-rooms` on a `*/15 * * * *` schedule
- Room API functions are capped at `10` seconds
- Cron cleanup functions are capped at `10` seconds
- Venue search functions are capped at `15` seconds
- Venue search functions opt into `supportsCancellation` so client aborts can stop unnecessary upstream work when Vercel supports request cancellation

## Runtime Assumptions

- All current API routes are Node.js routes and should stay on the Node runtime
- Venue search depends on an external Overpass provider and benefits from cancellation, runtime cache, and rate limiting
- Structured server logs are emitted to stdout/stderr and are expected to surface in Vercel logs
- Cron jobs run in UTC and only on production deployments, not preview deployments
- Region pinning is intentionally not hardcoded yet; the production region should be chosen to match the primary PostgreSQL region

## Durable Persistence Requirement

- Set `DATABASE_URL` in Vercel project environment variables for any shared preview or production deployment
- Set `CRON_SECRET` in Vercel project environment variables so scheduled cleanup requests are authenticated
- Set `HANGOUT_ROUTING_PROVIDER=mapbox` and `MAPBOX_ACCESS_TOKEN` if you want deployed rooms to use provider-backed route durations instead of the heuristic ETA fallback
- Run `npm run db:migrate` before first traffic so versioned SQL migrations are applied in order
- If `DATABASE_URL` is omitted, the app falls back to a temporary runtime file store; that fallback is acceptable for local development but not for durable Vercel environments

## Deployment Checklist

1. Set up the Vercel project against the root app, not `/my-idea-app`
2. Keep the package manager as `npm`
3. Provision PostgreSQL, set `DATABASE_URL`, and run `npm run db:migrate`
4. Set `CRON_SECRET` before enabling scheduled cleanup in production
5. Add any remaining optional env overrides only through Vercel project environment variables
6. Verify room create, join, vote, finalize, and scheduled cleanup flows against the deployed database before production cutover

## First Preview Smoke Profile

For the first durable preview deployment, prefer deterministic provider settings so the smoke test isolates Vercel + PostgreSQL behavior instead of third-party venue volatility:

- `DATABASE_URL=<preview postgres url>`
- `CRON_SECRET=<random 16+ char secret>`
- `HANGOUT_USE_FIXTURE_VENUES=true`
- `HANGOUT_USE_FIXTURE_ROUTING=true`
- `HANGOUT_ROUTING_PROVIDER=mapbox`
- `HANGOUT_ENABLE_STRUCTURED_LOGS=true`

This keeps the deployment durable because the database is real, while venue and routing providers stay deterministic during first preview verification.

## Deployed Smoke Command

Once the preview URL exists, run the browser smoke suite against it directly:

```bash
HANGOUT_SMOKE_BASE_URL=https://<preview-url> npm run test:e2e:deployed
```

Optional test-runner overrides for non-fixture deployments:

- `HANGOUT_SMOKE_EXPECT_FIXTURES=false`
- `HANGOUT_SMOKE_EXPECTED_VENUE_NAME=<expected finalized venue name>`
- `HANGOUT_SMOKE_EXPECTED_MAP_URL=<expected map url>`
