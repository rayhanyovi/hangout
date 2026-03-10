# Vercel Deployment Baseline

## Goal

This file records the current Vercel deployment posture for the root Next.js app and the assumptions that still matter before cutover.

## Checked-In Configuration

- `vercel.json` explicitly sets `framework` to `nextjs`
- `vercel.json` uses `npm ci` for deterministic installs
- Room API functions are capped at `10` seconds
- Venue search functions are capped at `15` seconds
- Venue search functions opt into `supportsCancellation` so client aborts can stop unnecessary upstream work when Vercel supports request cancellation

## Runtime Assumptions

- All current API routes are Node.js routes and should stay on the Node runtime
- Venue search depends on an external Overpass provider and benefits from cancellation, runtime cache, and rate limiting
- Structured server logs are emitted to stdout/stderr and are expected to surface in Vercel logs
- Region pinning is intentionally not hardcoded yet; the production region should be chosen to match the primary PostgreSQL region

## Durable Persistence Requirement

- Set `DATABASE_URL` in Vercel project environment variables for any shared preview or production deployment
- Run `npm run db:migrate` before first traffic so versioned SQL migrations are applied in order
- If `DATABASE_URL` is omitted, the app falls back to a temporary runtime file store; that fallback is acceptable for local development but not for durable Vercel environments

## Deployment Checklist

1. Set up the Vercel project against the root app, not `/my-idea-app`
2. Keep the package manager as `npm`
3. Provision PostgreSQL, set `DATABASE_URL`, and run `npm run db:migrate`
4. Add any remaining optional env overrides only through Vercel project environment variables
5. Verify room create, join, vote, and finalize flows against the deployed database before production cutover
