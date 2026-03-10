# Environment Configuration

## Scope

The root Next.js app can still boot locally with no custom environment variables.
For durable shared persistence, set `DATABASE_URL` so room data lives in PostgreSQL instead of the temporary file fallback.

## Platform Variables

These are usually supplied by Node.js or Vercel:

- `NODE_ENV`: standard runtime mode (`development`, `test`, or `production`)
- `VERCEL_ENV`: Vercel deployment environment (`development`, `preview`, or `production`)

## App Variables

Current optional server variables:

- `DATABASE_URL`
  Default: unset
  When present, room persistence uses PostgreSQL for rooms, members, votes, and venue cache instead of the fallback temp-file store. Run `npm run db:migrate` before first use.

- `CRON_SECRET`
  Default: unset
  Required for the scheduled cleanup route on Vercel. Use a random string with at least 16 characters so cron requests can be authenticated with a bearer token.

- `HANGOUT_ENABLE_STRUCTURED_LOGS`
  Default: `true`
  Controls whether structured analytics and operational logs are emitted from server routes and repositories.

- `HANGOUT_ROUTING_PROVIDER`
  Default: `heuristic`
  Chooses whether the fairness ETA lens stays heuristic-only or upgrades to a provider-backed routing adapter. Set this to `mapbox` only when `MAPBOX_ACCESS_TOKEN` is also available.

- `MAPBOX_ACCESS_TOKEN`
  Default: unset
  Optional server-only token for Mapbox Matrix routing. When present with `HANGOUT_ROUTING_PROVIDER=mapbox`, fairness ETA requests use provider-backed route durations for `walk`, `motor` (driving proxy), and `car` (driving-traffic).

- `HANGOUT_USE_FIXTURE_ROUTING`
  Default: `false`
  Test-only switch that makes the routing boundary return deterministic Mapbox-shaped fixture durations instead of calling the live provider. The Playwright smoke suite enables this automatically.

- `HANGOUT_ROUTING_CACHE_TTL_SECONDS`
  Default: `120`
  Fresh cache lifetime for fairness ETA route durations in the server runtime cache.

- `HANGOUT_ROUTING_STALE_TTL_SECONDS`
  Default: `360`
  Stale fallback lifetime for fairness ETA route durations after the fresh cache expires.

- `HANGOUT_ROUTING_RATE_LIMIT_WINDOW_SECONDS`
  Default: `30`
  Sliding window length for route-duration provider throttling.

- `HANGOUT_ROUTING_RATE_LIMIT_MAX_REQUESTS`
  Default: `12`
  Maximum uncached route-duration provider requests allowed per room or anonymous client within one routing rate-limit window.

- `HANGOUT_USE_FIXTURE_VENUES`
  Default: `false`
  Test-only switch that makes the venue search boundary return deterministic local fixtures instead of calling Overpass. The Playwright smoke suite enables this automatically.

- `HANGOUT_ROOM_STORE_DIR`
  Default: OS temp directory + `/hangout`
  Overrides the fallback file-backed room store path used only when `DATABASE_URL` is not configured.

- `HANGOUT_VENUE_CACHE_TTL_SECONDS`
  Default: `120`
  Fresh cache lifetime for venue search results in the server runtime cache.

- `HANGOUT_VENUE_STALE_TTL_SECONDS`
  Default: `360`
  Stale fallback lifetime for venue search results after the fresh cache expires.

- `HANGOUT_VENUE_RATE_LIMIT_WINDOW_SECONDS`
  Default: `30`
  Sliding window length for venue search provider throttling.

- `HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS`
  Default: `6`
  Maximum uncached venue provider requests allowed per room or anonymous client within one rate-limit window.

## Local Development

1. Copy `.env.example` to `.env.local` only if you need custom overrides.
2. If you want durable room persistence locally, set `DATABASE_URL` and run `npm run db:migrate`.
3. If you want provider-backed ETA locally, set `HANGOUT_ROUTING_PROVIDER=mapbox` and `MAPBOX_ACCESS_TOKEN`.
4. If you want to manually test the scheduled cleanup route, also set `CRON_SECRET` and call the route with `Authorization: Bearer <CRON_SECRET>`.
5. If `DATABASE_URL` is omitted, the app falls back to a temporary JSON room store under the OS temp directory.
6. Keep real secrets out of git-tracked env files.
7. Use `npm run dev` for local development after env changes.

## Current Notes

- There are no `NEXT_PUBLIC_` variables in use yet.
- Vercel production deployments should treat `DATABASE_URL` as required even though the local fallback store still exists.
- Vercel production deployments should also set `CRON_SECRET`, because the checked-in cron route rejects unauthenticated cleanup requests.
- Mapbox routing is optional; if `MAPBOX_ACCESS_TOKEN` is absent or `HANGOUT_ROUTING_PROVIDER` stays `heuristic`, the fairness shell falls back to the local ETA model automatically.
- `db/migrations/` is now the canonical schema history; `db/schema.sql` is the latest consolidated snapshot.
- `HANGOUT_ROOM_STORE_DIR` is now mainly for local development, CI, or test environments that intentionally skip PostgreSQL.
- Venue cache and rate limit values are best-effort in-memory controls in the Node.js runtime, not a shared distributed cache.
- Routing cache and rate limit values are also best-effort in-memory controls in the Node.js runtime, not a shared distributed cache.
