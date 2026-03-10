# Root App Parity Review

Review date: 2026-03-10

## Scope

Reference app reviewed:

- `/my-idea-app/src/pages/Index.tsx`
- `/my-idea-app/src/components/MemberPanel.tsx`
- `/my-idea-app/src/components/MapView.tsx`

Root app reviewed:

- `/`
- `/rooms/new`
- `/r/[joinCode]`
- `/r/[joinCode]/decision`

## Parity Reached Or Exceeded

- Member creation and member roster display
- Browser geolocation flow
- Manual coordinate input
- Midpoint computation and fairness summary
- Venue retrieval around a meeting radius
- Venue list rendering and category filtering
- Map rendering with members, midpoint, radius, and venues
- Shareable room route concept

The root app now exceeds the prototype with:

- Real room creation and join codes
- Persisted room snapshots
- Privacy-aware location storage
- Voting and host finalization
- Final decision route
- Server-side venue boundary, rate limiting, caching, and structured logging
- Loading, timeout, empty, and provider-error handling

## Remaining Differences

- The prototype exposes a live radius selector directly on the main room flow; the root app currently keeps radius in room setup and does not let members adjust it from `/r/[joinCode]`
- The prototype can refetch venues from the room page using active category toggles; the root app currently treats room categories as setup-time input and uses category chips mostly as shortlist filters
- The prototype falls back to random demo coordinates when geolocation fails; the root app intentionally does not replicate that behavior because it is not acceptable for production

## Conclusion

- Root parity is strong enough that `/my-idea-app` is no longer the active implementation source
- `/my-idea-app` should stay available as reference material until the remaining live-room parity choices are either implemented in root or explicitly dropped
- Durable production persistence remains a separate cutover blocker even though it is beyond prototype parity itself
