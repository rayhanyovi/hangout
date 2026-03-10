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
- Region pinning is intentionally not hardcoded yet; the production region should be chosen to match the eventual primary PostgreSQL region

## Important Limitation Before True Production Cutover

- The current room persistence layer is still a temporary file-backed store under the runtime filesystem
- That storage model is not durable across Vercel deployments or serverless instance churn
- Production cutover still requires replacing the temporary store with PostgreSQL or another durable persistence layer

## Deployment Checklist

1. Set up the Vercel project against the root app, not `/my-idea-app`
2. Keep the package manager as `npm`
3. Add any optional env overrides only through Vercel project environment variables
4. Do not treat the deployment as durable production until the persistence layer is upgraded
