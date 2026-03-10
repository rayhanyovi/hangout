export const ROUTING_ETA_STRATEGY = {
  boundary: "server-only provider adapter",
  defaultMode: "heuristic fallback",
  upstreamProvider: "mapbox_matrix",
  cacheScope: "room-and-midpoint",
  cacheTtlSeconds: 120,
  requestTimeoutSeconds: 10,
  staleFallbackAllowed: true,
  rateLimitScope: "per room",
  rationale:
    "Route durations need a server boundary so provider tokens, caching, throttling, and graceful fallback stay consistent across preview and live rooms.",
} as const;
