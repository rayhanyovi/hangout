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

This repository currently contains two separate app states:

- Root app: a Next.js 16 App Router shell in `/app` with Hangout branding applied
- Reference app: a Lovable export in `/my-idea-app` built with Vite + React + TypeScript
- Root TypeScript and ESLint validation are now scoped to the production app, not the Lovable reference folder

The root Next.js app now has branded metadata, styling tokens, and a landing shell, but core product flows are not yet implemented. The Lovable export still contains the only real product prototype today.

## Root App Structure

The root production app now follows this baseline structure:

- `app/` for route entries and layout boundaries
- `components/marketing/` for reusable presentation components used by route shells
- `components/maps/` for client-only Leaflet map boundaries used by App Router routes
- `lib/contracts/` for shared data contracts that can be used across client and server boundaries
- `lib/server/` for server-only integrations and orchestration logic
- `lib/math/`, `lib/venues/`, and `lib/validation/` for shared feature utilities
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

## What Exists In `my-idea-app`

Implemented prototype capabilities:

- Add/remove members locally
- Capture member location via browser geolocation
- Manual latitude/longitude input
- Compute a geometric median as the meeting point
- Show a fairness summary using haversine distance
- Search nearby venues from Overpass/OpenStreetMap
- Filter venues by category
- Show members, midpoint, search radius, and venues on a Leaflet map
- Copy a hardcoded room-style URL to clipboard

Current architecture in the Lovable export:

- Single-page client app
- React Router routes `/` and `/room/:roomId`, both rendering the same page
- No real backend
- No persistent room state
- No realtime sync
- No auth or member identity beyond local component state
- No database or TTL cleanup

## Gap Against The PRD/BRD

Important product requirements that are still missing:

- Real room lifecycle: create, join, host/member role, unique join code
- Shared room state across users
- Voting system and venue finalization
- Privacy mode and data retention policy
- Transport mode handling
- Address search / pin-on-map input flow
- Backend API and persistence layer
- Realtime or polling synchronization
- Production-grade observability, rate limiting, and error handling

In short: `my-idea-app` is a useful interaction prototype, not an MVP-complete production app.

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
- `my-idea-app` remains read-only reference until parity is complete
- Shared contracts live in root and drive both server and client code
- Venue search moves behind a server boundary
- Room state, member state, midpoint state, and voting state become explicit persisted entities
- Deployment target remains Vercel, with environment variables and provider limits handled in root app architecture

## Backend Decisions

- Persistence layer: PostgreSQL as the system of record for rooms, members, votes, and venue cache metadata
- Persistence access: server-only repository layer
- Expiry handling: room rows carry `expires_at`, with scheduled cleanup every 15 minutes
- Venue search boundary: server-only Overpass adapter with 120-second room-scoped cache and stale-cache fallback on provider failure
- Midpoint orchestration: recompute on location and fairness input changes, then persist the latest midpoint snapshot on the room
- Realtime strategy: 4-second polling for MVP, with explicit refresh events and a later upgrade path to realtime transport

## Working Assumption For Future Tasks

Treat `/my-idea-app` as a design and logic reference, not as code to harden in place. The main job is to rebuild the product properly in the root Next.js app, using the prototype only where it meaningfully accelerates parity.
