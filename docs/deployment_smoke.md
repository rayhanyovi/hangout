# Deployment Smoke Runbook

## Goal

Run the core Hangout room flow against a deployed preview or production URL without starting a local dev server.

## Required Inputs

- A reachable deployment URL, for example `https://hangout-git-preview-branch.vercel.app`
- A deployment that already has durable PostgreSQL configured
- For the first stable preview pass, deterministic provider envs are recommended:
  - `HANGOUT_USE_FIXTURE_VENUES=true`
  - `HANGOUT_USE_FIXTURE_ROUTING=true`
  - `HANGOUT_ROUTING_PROVIDER=mapbox`

## Command

```bash
HANGOUT_SMOKE_BASE_URL=https://<preview-url> npm run test:e2e:deployed
```

## Optional Runner Overrides

Use these only if the deployment is not using fixture providers:

- `HANGOUT_SMOKE_EXPECT_FIXTURES=false`
- `HANGOUT_SMOKE_EXPECTED_VENUE_NAME=<expected venue>`
- `HANGOUT_SMOKE_EXPECTED_MAP_URL=<expected map url>`
- `HANGOUT_SMOKE_EXPECTED_ROUTING_LABEL=<expected routing label>`

## What The Smoke Covers

1. Create room as host.
2. Join as a second member.
3. Share host location with map pin.
4. Share second member location with manual coordinates.
5. Verify venue shortlist appears.
6. Cast votes from both members.
7. Finalize from the host view.
8. Verify the decision route and Maps handoff.

## When To Use It

- After the first durable preview deployment is live.
- After changing database schema, room APIs, or voting/finalization flows.
- Before promoting a preview deployment to production.

## Notes

- This harness validates the deployed app and live database path, not only local app behavior.
- It does not provision Vercel or PostgreSQL by itself; it starts only after a target URL already exists.
