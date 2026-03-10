export const VENUE_SEARCH_STRATEGY = {
  boundary: "server-only provider adapter",
  upstreamProvider: "overpass",
  cacheScope: "room-and-query",
  cacheTtlSeconds: 120,
  requestTimeoutSeconds: 10,
  staleFallbackAllowed: true,
  failureMode: "return stale cache or typed empty result with provider error metadata",
  rateLimitScope: "per room",
  rationale:
    "Venue provider traffic must be controlled from the server so caching, rate limiting, and fallback behavior stay deterministic.",
} as const;
