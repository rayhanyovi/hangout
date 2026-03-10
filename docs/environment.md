# Environment Configuration

## Scope

The root Next.js app currently has no required custom environment variables to boot locally.
All custom variables below are optional runtime overrides for server behavior.

## Platform Variables

These are usually supplied by Node.js or Vercel:

- `NODE_ENV`: standard runtime mode (`development`, `test`, or `production`)
- `VERCEL_ENV`: Vercel deployment environment (`development`, `preview`, or `production`)

## App Variables

Current optional server variables:

- `HANGOUT_ENABLE_STRUCTURED_LOGS`
  Default: `true`
  Controls whether structured analytics and operational logs are emitted from server routes and repositories.

- `HANGOUT_ROOM_STORE_DIR`
  Default: OS temp directory + `/hangout`
  Overrides the temporary file-backed room store path used by the current MVP persistence layer.

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
2. Keep real secrets out of git-tracked env files.
3. Use `npm run dev` for local development after env changes.

## Current Notes

- There are no `NEXT_PUBLIC_` variables in use yet.
- The current room persistence layer is temporary and file-backed, so `HANGOUT_ROOM_STORE_DIR` is mainly for local development, CI, or containerized runtimes.
- Venue cache and rate limit values are best-effort in-memory controls in the Node.js runtime, not a shared distributed cache.
