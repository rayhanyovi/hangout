import type { BudgetLevel, Coordinate, VenueCategory } from "@/lib/contracts";
import { fetchOverpassVenues } from "@/lib/venues";
import { rankVenuesForRoom, type RankedVenue } from "@/lib/rooms";
import { serverEnv } from "@/lib/server/config/env";

type SearchRoomVenuesInput = {
  midpoint: Coordinate;
  radiusM: number;
  categories: VenueCategory[];
  tags: string[];
  budget?: BudgetLevel;
  limit?: number;
  rateLimitKey: string;
};

export type VenueSearchResult = {
  venues: RankedVenue[];
  provider: "overpass";
  cacheStatus: "hit" | "miss" | "stale";
  rateLimit: {
    limited: boolean;
    retryAfterSeconds: number | null;
    scope: string;
  };
};

type VenueSearchCacheEntry = {
  venues: RankedVenue[];
  updatedAtMs: number;
  freshUntilMs: number;
  staleUntilMs: number;
};

type VenueRateLimitEntry = {
  count: number;
  windowStartedAtMs: number;
};

type VenueSearchRuntimeState = {
  cache: Map<string, VenueSearchCacheEntry>;
  inflight: Map<string, Promise<VenueSearchResult>>;
  rateLimits: Map<string, VenueRateLimitEntry>;
};

const VENUE_CACHE_TTL_MS = serverEnv.HANGOUT_VENUE_CACHE_TTL_SECONDS * 1000;
const VENUE_STALE_TTL_MS = serverEnv.HANGOUT_VENUE_STALE_TTL_SECONDS * 1000;
const VENUE_RATE_LIMIT_WINDOW_MS =
  serverEnv.HANGOUT_VENUE_RATE_LIMIT_WINDOW_SECONDS * 1000;
const VENUE_RATE_LIMIT_MAX_REQUESTS =
  serverEnv.HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS;

declare global {
  var __hangoutVenueSearchRuntimeState: VenueSearchRuntimeState | undefined;
}

function createRuntimeState(): VenueSearchRuntimeState {
  return {
    cache: new Map(),
    inflight: new Map(),
    rateLimits: new Map(),
  };
}

function getRuntimeState() {
  if (!globalThis.__hangoutVenueSearchRuntimeState) {
    globalThis.__hangoutVenueSearchRuntimeState = createRuntimeState();
  }

  return globalThis.__hangoutVenueSearchRuntimeState;
}

function normalizeList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).sort();
}

function normalizeCoordinate(value: number) {
  return Number(value.toFixed(4));
}

function buildVenueSearchCacheKey({
  midpoint,
  radiusM,
  categories,
  tags,
  budget,
  limit = 8,
}: Omit<SearchRoomVenuesInput, "rateLimitKey">) {
  return JSON.stringify({
    midpoint: {
      lat: normalizeCoordinate(midpoint.lat),
      lng: normalizeCoordinate(midpoint.lng),
    },
    radiusM,
    categories: [...categories].sort(),
    tags: normalizeList(tags),
    budget: budget ?? null,
    limit,
  });
}

function pruneRuntimeState(state: VenueSearchRuntimeState, nowMs: number) {
  for (const [key, entry] of state.cache.entries()) {
    if (entry.staleUntilMs <= nowMs) {
      state.cache.delete(key);
    }
  }

  for (const [key, entry] of state.rateLimits.entries()) {
    if (entry.windowStartedAtMs + VENUE_RATE_LIMIT_WINDOW_MS <= nowMs) {
      state.rateLimits.delete(key);
    }
  }
}

function getRetryAfterSeconds(windowStartedAtMs: number, nowMs: number) {
  return Math.max(
    1,
    Math.ceil((windowStartedAtMs + VENUE_RATE_LIMIT_WINDOW_MS - nowMs) / 1000),
  );
}

function consumeRateLimit(
  state: VenueSearchRuntimeState,
  scope: string,
  nowMs: number,
) {
  const existing = state.rateLimits.get(scope);

  if (
    !existing ||
    existing.windowStartedAtMs + VENUE_RATE_LIMIT_WINDOW_MS <= nowMs
  ) {
    state.rateLimits.set(scope, {
      count: 1,
      windowStartedAtMs: nowMs,
    });

    return {
      limited: false,
      retryAfterSeconds: null,
    };
  }

  if (existing.count >= VENUE_RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      retryAfterSeconds: getRetryAfterSeconds(existing.windowStartedAtMs, nowMs),
    };
  }

  state.rateLimits.set(scope, {
    ...existing,
    count: existing.count + 1,
  });

  return {
    limited: false,
    retryAfterSeconds: null,
  };
}

async function fetchAndRankVenues({
  midpoint,
  radiusM,
  categories,
  tags,
  budget,
  limit = 8,
}: Omit<SearchRoomVenuesInput, "rateLimitKey">) {
  const venues = await fetchOverpassVenues(midpoint, radiusM, categories);

  return rankVenuesForRoom(
    venues,
    {
      categories,
      tags,
      budget,
      radiusMDefault: radiusM,
    },
    limit,
  );
}

export class VenueSearchRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Venue search is temporarily rate limited.");
    this.name = "VenueSearchRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function searchRoomVenues({
  midpoint,
  radiusM,
  categories,
  tags,
  budget,
  limit = 8,
  rateLimitKey,
}: SearchRoomVenuesInput): Promise<VenueSearchResult> {
  const nowMs = Date.now();
  const state = getRuntimeState();
  pruneRuntimeState(state, nowMs);

  const cacheKey = buildVenueSearchCacheKey({
    midpoint,
    radiusM,
    categories,
    tags,
    budget,
    limit,
  });
  const cachedEntry = state.cache.get(cacheKey);
  const freshCacheAvailable =
    cachedEntry !== undefined && cachedEntry.freshUntilMs > nowMs;
  const staleCacheAvailable =
    cachedEntry !== undefined && cachedEntry.staleUntilMs > nowMs;

  if (freshCacheAvailable) {
    return {
      venues: cachedEntry.venues,
      provider: "overpass",
      cacheStatus: "hit",
      rateLimit: {
        limited: false,
        retryAfterSeconds: null,
        scope: rateLimitKey,
      },
    };
  }

  const inflightRequest = state.inflight.get(cacheKey);

  if (inflightRequest) {
    return inflightRequest;
  }

  const rateLimit = consumeRateLimit(state, rateLimitKey, nowMs);

  if (rateLimit.limited) {
    if (staleCacheAvailable) {
      return {
        venues: cachedEntry.venues,
        provider: "overpass",
        cacheStatus: "stale",
        rateLimit: {
          limited: true,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          scope: rateLimitKey,
        },
      };
    }

    throw new VenueSearchRateLimitError(rateLimit.retryAfterSeconds ?? 1);
  }

  const searchPromise = (async () => {
    try {
      const venues = await fetchAndRankVenues({
        midpoint,
        radiusM,
        categories,
        tags,
        budget,
        limit,
      });

      state.cache.set(cacheKey, {
        venues,
        updatedAtMs: Date.now(),
        freshUntilMs: Date.now() + VENUE_CACHE_TTL_MS,
        staleUntilMs: Date.now() + VENUE_STALE_TTL_MS,
      });

      return {
        venues,
        provider: "overpass" as const,
        cacheStatus: "miss" as const,
        rateLimit: {
          limited: false,
          retryAfterSeconds: null,
          scope: rateLimitKey,
        },
      };
    } catch (error) {
      const staleEntry = state.cache.get(cacheKey);
      const staleAvailable =
        staleEntry !== undefined && staleEntry.staleUntilMs > Date.now();

      if (staleAvailable) {
        return {
          venues: staleEntry.venues,
          provider: "overpass" as const,
          cacheStatus: "stale" as const,
          rateLimit: {
            limited: false,
            retryAfterSeconds: null,
            scope: rateLimitKey,
          },
        };
      }

      throw error;
    } finally {
      state.inflight.delete(cacheKey);
    }
  })();

  state.inflight.set(cacheKey, searchPromise);

  return searchPromise;
}

export function resetVenueSearchRuntimeStateForTests() {
  globalThis.__hangoutVenueSearchRuntimeState = createRuntimeState();
}
