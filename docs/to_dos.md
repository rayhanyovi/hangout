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
- [ ] Define the room state machine: open, finalized, expired
- [ ] Define privacy and retention rules in implementation terms

## Backend And Data

- [ ] Choose the persistence layer for rooms, members, votes, and TTL cleanup
- [ ] Design server APIs or server actions for room create/join/update flows
- [ ] Design the venue search server boundary, including caching and provider failure handling
- [ ] Define how midpoint computation will be triggered and stored
- [ ] Define realtime strategy for MVP: polling or realtime provider

## App Foundation

- [ ] Install the required UI, map, validation, and testing dependencies in the root Next.js app
- [ ] Set up shared utilities for math, venue mapping, and request validation
- [ ] Set up client-only map boundary for Leaflet within App Router
- [ ] Set up testing baseline for unit and integration coverage in the root app

## Feature Migration

- [ ] Build the landing/create-room flow
- [ ] Build the room page route and shell
- [ ] Migrate member management UI from the prototype into root Next.js
- [ ] Implement privacy-aware location input flows
- [ ] Implement midpoint computation and fairness summary
- [ ] Implement venue retrieval, scoring, filtering, and list rendering
- [ ] Implement the map experience with members, midpoint, radius, and venues
- [ ] Implement shareable room links with real join codes
- [ ] Implement voting, vote updates, and host finalization
- [ ] Implement finalized decision summary and deep links to maps

## Production Readiness

- [ ] Add loading, empty, timeout, and provider-error states across core flows
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
