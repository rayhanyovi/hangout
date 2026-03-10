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

- `HANGOUT_ENABLE_STRUCTURED_LOGS`
  Default: `true`
  Controls whether structured analytics and operational logs are emitted from server routes and repositories.

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
3. If `DATABASE_URL` is omitted, the app falls back to a temporary JSON room store under the OS temp directory.
4. Keep real secrets out of git-tracked env files.
5. Use `npm run dev` for local development after env changes.

## Current Notes

- There are no `NEXT_PUBLIC_` variables in use yet.
- Vercel production deployments should treat `DATABASE_URL` as required even though the local fallback store still exists.
- `db/migrations/` is now the canonical schema history; `db/schema.sql` is the latest consolidated snapshot.
- `HANGOUT_ROOM_STORE_DIR` is now mainly for local development, CI, or test environments that intentionally skip PostgreSQL.
- Venue cache and rate limit values are best-effort in-memory controls in the Node.js runtime, not a shared distributed cache.
