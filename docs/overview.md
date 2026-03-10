# Project Hangout Overview

## Purpose

Project Hangout is a fairness-first hangout planner for small groups. The intended MVP flow from the PRD/BRD is:

1. Create or join a room.
2. Share each member's location.
3. Compute a fair meeting point.
4. Recommend venues near that point.
5. Let members vote and finalize one venue.

The core product promise is simple: reduce location debate, make the tradeoff transparent, and move the group to a final decision quickly.

## Current Repo State

This repository now has one active application state:

- Root app: a Next.js 16 App Router app in `/app` with Hangout branding, routes, APIs, and production-oriented boundaries
- The root Next.js app now covers the active MVP path: create room, join room, share location, compute midpoint and fairness, retrieve venue candidates, vote, finalize, and render a decision summary
- Room persistence now supports durable PostgreSQL storage when `DATABASE_URL` is configured, with the temporary JSON store kept only as a local fallback
- PostgreSQL schema changes now have a versioned migration path in `db/migrations/`, with `db/schema.sql` kept as the latest consolidated snapshot
- Expired room cleanup now has a dedicated authenticated cron route and Vercel schedule, not only request-driven pruning
- Venue search now runs behind a server-only Overpass boundary with runtime caching, stale fallback, and per-room rate limiting
- Core room APIs and venue search now emit structured server logs for analytics and operational troubleshooting
- Local browser-level smoke coverage now exists for the create, join, location share, vote, finalize, and decision flow via Playwright
- A deployed smoke harness now exists via `npm run test:e2e:deployed` so preview or production URLs can be exercised without spinning up a local dev server
- Member location input now supports pin-on-map selection in addition to GPS capture and raw coordinate entry
- Fairness shell now upgrades from heuristic ETA to provider-backed route durations when Mapbox routing env is configured, with heuristic fallback kept for local/offline or unsupported modes
- Mobile MVP routes have been checked at `320px` and `390px` widths with no horizontal overflow on `/`, `/rooms/new`, and `/r/[joinCode]`
- A Vercel deployment baseline now exists in `vercel.json` and `docs/vercel_deployment.md`, and durable persistence is available once `DATABASE_URL` and `db/schema.sql` are applied
- The live room flow now includes parity controls for radius adjustment and live category-driven venue refetch directly from `/r/[joinCode]`
- The historical Lovable prototype has been cut over and removed from the working tree; parity context is retained in `docs/parity_review.md`

## Root App Structure

The root production app now follows this baseline structure:

- `app/` for route entries and layout boundaries
- `components/marketing/` for reusable presentation components used by route shells
- `components/maps/` for client-only Leaflet map boundaries used by App Router routes
- `db/` for the checked-in PostgreSQL schema used by durable room persistence
- `lib/contracts/` for shared data contracts that can be used across client and server boundaries
- `lib/server/` for server-only integrations and orchestration logic
- `lib/math/`, `lib/venues/`, and `lib/validation/` for shared feature utilities
- `scripts/` for operational helpers such as schema application
- foundation packages for validation, map rendering, UI utilities, and testing are installed in the root app

This is only the initial scaffold. Feature-specific folders will be added once route contracts and data contracts are frozen.

## MVP Route Map

The MVP route map is now frozen to these paths:

- `/` for landing page and product framing
- `/rooms/new` for host setup and room creation
- `/r/[joinCode]` for the live room experience: join, location, midpoint, venues, voting, and finalization
- `/r/[joinCode]/decision` for finalized decision output and maps handoff

This route map intentionally keeps the shared room flow on one stable room URL, with a separate finalized summary route after the venue is locked.

## Shared Contracts Baseline

The root app now has a first stable domain contract layer in `lib/contracts/` covering:

- request and response contracts for room create, join, snapshot, location update, midpoint compute, vote, and finalize flows
- domain entities for room, member, location, midpoint, venue, vote, and finalized decision
- route helpers for MVP URL generation
- room state transitions for `open`, `finalized`, and `expired`
- privacy policy constants for TTL, cleanup cadence, and coordinate rounding

These contracts are intended to stay stable while UI and server implementation iterate around them.

## Historical Prototype Snapshot

The removed Lovable prototype provided these capabilities during the audit and migration phase:

- Add/remove members locally
- Capture member location via browser geolocation
- Manual latitude/longitude input
- Compute a geometric median as the meeting point
- Show a fairness summary using haversine distance
- Search nearby venues from Overpass/OpenStreetMap
- Filter venues by category
- Show members, midpoint, search radius, and venues on a Leaflet map
- Copy a hardcoded room-style URL to clipboard

Prototype architecture during the audit:

- Single-page client app
- React Router routes `/` and `/room/:roomId`, both rendering the same page
- No real backend
- No persistent room state
- No realtime sync
- No auth or member identity beyond local component state
- No database or TTL cleanup

## Gap Against The PRD/BRD

Important product requirements that are still missing:

- Full routing-provider rollout in deployed environments; provider support now exists in code, but live environment setup and smoke verification are still pending
- Optional geocoded address search UX; pin-on-map input already exists, but text-address lookup is not implemented yet
- Environment hardening, deployment assumptions, and final Vercel rollout sign-off

In short: the root app now holds the MVP-complete implementation path, while the old prototype remains only as documented history.

## Audit Findings

High-signal findings from the audit:

- Before repo isolation, root build was blocked because the root Next.js TypeScript scope included files inside `/my-idea-app`, even though that folder should be reference-only.
- Before repo isolation, root lint also scanned `/my-idea-app`, so reference code quality issues polluted root repo health.
- `my-idea-app/package-lock.json` is out of sync with `my-idea-app/package.json`, so `npm ci` fails before validation can run cleanly.
- The Lovable export assumes a Vite alias model (`@` -> `src`) that does not match the root Next.js alias scope.
- Venue fetching is done directly from the browser to `https://overpass-api.de/api/interpreter`, which is fragile for production use and hard to control for rate limiting, caching, and fallback behavior.
- The current "share room" feature copies a hardcoded URL (`/room/HANG42`), so it is only a UI placeholder.
- The geolocation fallback injects random Jakarta-area coordinates when browser geolocation fails. That is acceptable for a demo, but invalid for production behavior.
- The prototype uses browser-only dependencies like `react-leaflet`, `window`, and `navigator`, so the eventual Next.js migration needs clear client/server boundaries.

## Suggested Target Direction

Recommended target shape for the production app:

- Root Next.js App Router app becomes the only active application
- Shared contracts live in root and drive both server and client code
- Venue search moves behind a server boundary
- Room state, member state, midpoint state, and voting state become explicit persisted entities
- Deployment target remains Vercel, with environment variables and provider limits handled in root app architecture

## Backend Decisions

- Persistence layer: PostgreSQL as the system of record for rooms, members, votes, and venue cache metadata
- Persistence access: server-only repository layer
- Schema evolution: versioned SQL migrations under `db/migrations/`, with `db/schema.sql` as the latest reference snapshot
- Expiry handling: room rows carry `expires_at`, with request-driven pruning plus a 15-minute authenticated cron cleanup route
- Venue search boundary: server-only Overpass adapter with 120-second room-scoped cache and stale-cache fallback on provider failure
- Fairness ETA boundary: server-only Mapbox Matrix adapter with runtime cache, stale fallback, and heuristic fallback when provider config is absent or unsupported
- Midpoint orchestration: recompute on location and fairness input changes, then persist the latest midpoint snapshot on the room
- Realtime strategy: 4-second polling for MVP, with explicit refresh events and a later upgrade path to realtime transport

## Working Assumption For Future Tasks

Treat the root Next.js app as the only live implementation. If historical prototype behavior matters, use `docs/parity_review.md`, the PRD/BRD text, and git history rather than rebuilding a second app boundary.
