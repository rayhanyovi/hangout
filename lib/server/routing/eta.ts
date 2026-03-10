import "server-only";

import type { FairnessEtaInput, FairnessEtaOutput } from "@/lib/contracts";
import { buildMidpointFairnessSummary } from "@/lib/rooms";
import { serverEnv } from "@/lib/server/config/env";
import { fetchMapboxFairnessEta } from "@/lib/server/routing/mapbox";

type ResolveFairnessEtaInput = FairnessEtaInput & {
  rateLimitKey: string;
  signal?: AbortSignal;
};

type RoutingEtaCacheEntry = {
  result: Omit<FairnessEtaOutput, "cacheStatus">;
  freshUntilMs: number;
  staleUntilMs: number;
};

type RoutingRateLimitEntry = {
  count: number;
  windowStartedAtMs: number;
};

type RoutingEtaRuntimeState = {
  cache: Map<string, RoutingEtaCacheEntry>;
  inflight: Map<string, Promise<FairnessEtaOutput>>;
  rateLimits: Map<string, RoutingRateLimitEntry>;
};

const ROUTING_CACHE_TTL_MS = serverEnv.HANGOUT_ROUTING_CACHE_TTL_SECONDS * 1000;
const ROUTING_STALE_TTL_MS = serverEnv.HANGOUT_ROUTING_STALE_TTL_SECONDS * 1000;
const ROUTING_RATE_LIMIT_WINDOW_MS =
  serverEnv.HANGOUT_ROUTING_RATE_LIMIT_WINDOW_SECONDS * 1000;
const ROUTING_RATE_LIMIT_MAX_REQUESTS =
  serverEnv.HANGOUT_ROUTING_RATE_LIMIT_MAX_REQUESTS;

declare global {
  var __hangoutRoutingEtaRuntimeState: RoutingEtaRuntimeState | undefined;
}

function createRuntimeState(): RoutingEtaRuntimeState {
  return {
    cache: new Map(),
    inflight: new Map(),
    rateLimits: new Map(),
  };
}

function getRuntimeState() {
  if (!globalThis.__hangoutRoutingEtaRuntimeState) {
    globalThis.__hangoutRoutingEtaRuntimeState = createRuntimeState();
  }

  return globalThis.__hangoutRoutingEtaRuntimeState;
}

function normalizeCoordinate(value: number) {
  return Number(value.toFixed(4));
}

function buildRoutingCacheKey({
  midpoint,
  members,
  transportMode,
}: Pick<FairnessEtaInput, "midpoint" | "members" | "transportMode">) {
  return JSON.stringify({
    midpoint: {
      lat: normalizeCoordinate(midpoint.lat),
      lng: normalizeCoordinate(midpoint.lng),
    },
    members: members.map((member) => ({
      id: member.id,
      lat: normalizeCoordinate(member.lat),
      lng: normalizeCoordinate(member.lng),
    })),
    transportMode,
  });
}

function pruneRuntimeState(state: RoutingEtaRuntimeState, nowMs: number) {
  for (const [key, entry] of state.cache.entries()) {
    if (entry.staleUntilMs <= nowMs) {
      state.cache.delete(key);
    }
  }

  for (const [key, entry] of state.rateLimits.entries()) {
    if (entry.windowStartedAtMs + ROUTING_RATE_LIMIT_WINDOW_MS <= nowMs) {
      state.rateLimits.delete(key);
    }
  }
}

function getRetryAfterSeconds(windowStartedAtMs: number, nowMs: number) {
  return Math.max(
    1,
    Math.ceil((windowStartedAtMs + ROUTING_RATE_LIMIT_WINDOW_MS - nowMs) / 1000),
  );
}

function consumeRateLimit(
  state: RoutingEtaRuntimeState,
  scope: string,
  nowMs: number,
) {
  const existing = state.rateLimits.get(scope);

  if (
    !existing ||
    existing.windowStartedAtMs + ROUTING_RATE_LIMIT_WINDOW_MS <= nowMs
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

  if (existing.count >= ROUTING_RATE_LIMIT_MAX_REQUESTS) {
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

function buildHeuristicEtaResult(
  input: Pick<FairnessEtaInput, "midpoint" | "members" | "transportMode">,
  note?: string | null,
): FairnessEtaOutput {
  const summary = buildMidpointFairnessSummary(input.members, input.transportMode);

  return {
    rows: summary.rows.map((row) => ({
      id: row.id,
      etaMin: row.etaMin,
    })),
    transportMode: input.transportMode,
    source: "heuristic",
    providerLabel: summary.etaProviderLabel,
    note: note ?? summary.etaNote,
    cacheStatus: "miss",
  };
}

function isMapboxRoutingEnabled() {
  return (
    serverEnv.HANGOUT_USE_FIXTURE_ROUTING ||
    (serverEnv.HANGOUT_ROUTING_PROVIDER === "mapbox" &&
      Boolean(serverEnv.MAPBOX_ACCESS_TOKEN))
  );
}

function buildStaleProviderResult(
  result: Omit<FairnessEtaOutput, "cacheStatus">,
  note: string,
): FairnessEtaOutput {
  return {
    ...result,
    cacheStatus: "stale",
    note,
  };
}

async function fetchProviderEta(
  input: Pick<FairnessEtaInput, "midpoint" | "members" | "transportMode">,
  signal?: AbortSignal,
) {
  return fetchMapboxFairnessEta({
    ...input,
    accessToken: serverEnv.MAPBOX_ACCESS_TOKEN ?? "fixture-token",
    fixtureMode: serverEnv.HANGOUT_USE_FIXTURE_ROUTING,
    signal,
  });
}

export async function resolveFairnessEta({
  midpoint,
  members,
  transportMode,
  rateLimitKey,
  signal,
}: ResolveFairnessEtaInput): Promise<FairnessEtaOutput> {
  const input = {
    midpoint,
    members,
    transportMode,
  };

  if (!isMapboxRoutingEnabled()) {
    return buildHeuristicEtaResult(
      input,
      serverEnv.HANGOUT_ROUTING_PROVIDER === "mapbox"
        ? "Showing heuristic ETA because Mapbox routing is not fully configured in this environment."
        : "Showing heuristic ETA because provider routing is disabled for this environment.",
    );
  }

  const nowMs = Date.now();
  const state = getRuntimeState();
  pruneRuntimeState(state, nowMs);

  const cacheKey = buildRoutingCacheKey(input);
  const cachedEntry = state.cache.get(cacheKey);
  const freshCacheAvailable =
    cachedEntry !== undefined && cachedEntry.freshUntilMs > nowMs;
  const staleCacheAvailable =
    cachedEntry !== undefined && cachedEntry.staleUntilMs > nowMs;

  if (freshCacheAvailable) {
    return {
      ...cachedEntry.result,
      cacheStatus: "hit",
    };
  }

  const inflightRequest = state.inflight.get(cacheKey);

  if (inflightRequest) {
    return inflightRequest;
  }

  const rateLimit = consumeRateLimit(state, rateLimitKey, nowMs);

  if (rateLimit.limited) {
    if (staleCacheAvailable) {
      return buildStaleProviderResult(
        cachedEntry.result,
        `Using cached ${cachedEntry.result.providerLabel} durations while live routing cools down.`,
      );
    }

    return buildHeuristicEtaResult(
      input,
      `Showing heuristic ETA while provider routing is rate limited. Retry in ${rateLimit.retryAfterSeconds ?? 1} seconds.`,
    );
  }

  const etaPromise = (async () => {
    try {
      const result = await fetchProviderEta(input, signal);

      state.cache.set(cacheKey, {
        result,
        freshUntilMs: Date.now() + ROUTING_CACHE_TTL_MS,
        staleUntilMs: Date.now() + ROUTING_STALE_TTL_MS,
      });

      return {
        ...result,
        cacheStatus: "miss" as const,
      };
    } catch (error) {
      const staleEntry = state.cache.get(cacheKey);
      const staleAvailable =
        staleEntry !== undefined && staleEntry.staleUntilMs > Date.now();

      if (staleAvailable) {
        return buildStaleProviderResult(
          staleEntry.result,
          `Using cached ${staleEntry.result.providerLabel} durations while live routing refresh is unavailable.`,
        );
      }

      return buildHeuristicEtaResult(
        input,
        error instanceof Error
          ? `Showing heuristic ETA because provider routing failed: ${error.message}`
          : "Showing heuristic ETA because provider routing failed.",
      );
    } finally {
      state.inflight.delete(cacheKey);
    }
  })();

  state.inflight.set(cacheKey, etaPromise);

  return etaPromise;
}

export function resetRoutingEtaRuntimeStateForTests() {
  globalThis.__hangoutRoutingEtaRuntimeState = createRuntimeState();
}
