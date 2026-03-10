# Project Hangout To Do

Checklist convention:

- Use `[x]` only for work that is actually finished.
- Use `[ ]` for not started.
- If something is ongoing, keep it unchecked and add `(in progress)` in the line text.

## Done

- [x] Audit the current Lovable export in `/my-idea-app`
- [x] Cross-check current implementation against `docs/Project Hangout - Unified PRD + BRD.txt`
- [x] Create `docs/overview.md` as the baseline project map
- [x] Establish a canonical workflow contract in `docs/workflow_contract.md`

## Repo Baseline

- [x] Isolate root Next.js tooling from `/my-idea-app` so root build/lint only validate the production app
- [x] Decide the canonical package manager and lockfile strategy for the root app
- [x] Replace the default Next.js starter page, metadata, and styling tokens with Project Hangout branding
- [x] Define the root folder structure for app routes, components, lib, server utilities, and shared contracts

## Product Contracts

- [x] Freeze the MVP route map for the Next.js app
- [x] Define stable TypeScript contracts for room, member, location, midpoint, venue, vote, and finalized decision
- [x] Define the room state machine: open, finalized, expired
- [x] Define privacy and retention rules in implementation terms

## Backend And Data

- [x] Choose the persistence layer for rooms, members, votes, and TTL cleanup
- [x] Design server APIs or server actions for room create/join/update flows
- [x] Design the venue search server boundary, including caching and provider failure handling
- [x] Define how midpoint computation will be triggered and stored
- [x] Define realtime strategy for MVP: polling or realtime provider

## App Foundation

- [x] Install the required UI, map, validation, and testing dependencies in the root Next.js app
- [x] Set up shared utilities for math, venue mapping, and request validation
- [x] Set up client-only map boundary for Leaflet within App Router
- [x] Set up testing baseline for unit and integration coverage in the root app

## Feature Migration

- [x] Build the landing/create-room flow
- [x] Build the room page route and shell
- [x] Migrate member management UI from the prototype into root Next.js
- [x] Implement privacy-aware location input flows
- [x] Implement midpoint computation and fairness summary
- [x] Implement venue retrieval, scoring, filtering, and list rendering
- [x] Implement the map experience with members, midpoint, radius, and venues
- [x] Implement shareable room links with real join codes
- [x] Implement voting, vote updates, and host finalization
- [x] Implement finalized decision summary and deep links to maps

## Production Readiness

- [x] Add loading, empty, timeout, and provider-error states across core flows
- [ ] Add rate limiting and caching around venue search
- [ ] Add analytics and operational logging for key room events
- [ ] Add environment variable documentation and example config
- [ ] Validate mobile usability and responsive behavior
- [ ] Prepare Vercel deployment configuration and runtime assumptions

## Cutover

- [ ] Run a parity review between root Next.js app and `/my-idea-app`
- [ ] Remove obsolete starter assets and placeholder content from the root app
- [ ] Remove `/my-idea-app` after required parity is complete
- [ ] Re-run build, lint, and tests from the root app as release gates
