import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/venues", () => ({
  fetchOverpassVenues: vi.fn(),
}));

import { fetchOverpassVenues } from "@/lib/venues";
import {
  resetVenueSearchRuntimeStateForTests,
  searchRoomVenues,
  VenueSearchRateLimitError,
} from "@/lib/server/venues/search";

const mockFetchOverpassVenues = vi.mocked(fetchOverpassVenues);

const PROVIDER_VENUE = {
  venueId: "venue-1",
  providerId: "provider-1",
  name: "Kopi Tengah",
  category: "cafe" as const,
  address: "Jl. Sudirman",
  rating: 4.6,
  priceLevel: 2,
  openNow: true,
  distanceToCenterM: 180,
  tags: ["wifi", "cozy"],
  lat: -6.2,
  lng: 106.8,
  mapUrl: "https://maps.example.com/venue-1",
};

const BASE_INPUT = {
  midpoint: {
    lat: -6.2,
    lng: 106.8,
  },
  radiusM: 2000,
  categories: ["cafe"] as const,
  tags: ["wifi"],
  budget: "mid" as const,
  limit: 8,
  rateLimitKey: "room:ROOM42",
};

describe("searchRoomVenues", () => {
  beforeEach(() => {
    resetVenueSearchRuntimeStateForTests();
    mockFetchOverpassVenues.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a cache hit for repeated identical queries", async () => {
    mockFetchOverpassVenues.mockResolvedValue([PROVIDER_VENUE]);

    const first = await searchRoomVenues(BASE_INPUT);
    const second = await searchRoomVenues(BASE_INPUT);

    expect(first.cacheStatus).toBe("miss");
    expect(second.cacheStatus).toBe("hit");
    expect(mockFetchOverpassVenues).toHaveBeenCalledTimes(1);
  });

  it("returns stale cache when the provider fails after cache expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T00:00:00.000Z"));
    mockFetchOverpassVenues
      .mockResolvedValueOnce([PROVIDER_VENUE])
      .mockRejectedValueOnce(new Error("Provider down."));

    const first = await searchRoomVenues(BASE_INPUT);

    vi.setSystemTime(new Date("2026-03-10T00:02:05.000Z"));

    const second = await searchRoomVenues(BASE_INPUT);

    expect(first.cacheStatus).toBe("miss");
    expect(second.cacheStatus).toBe("stale");
    expect(second.venues[0]?.name).toBe("Kopi Tengah");
    expect(mockFetchOverpassVenues).toHaveBeenCalledTimes(2);
  });

  it("rate limits uncached venue searches within the active window", async () => {
    mockFetchOverpassVenues.mockResolvedValue([PROVIDER_VENUE]);

    for (let index = 0; index < 6; index += 1) {
      await searchRoomVenues({
        ...BASE_INPUT,
        midpoint: {
          lat: BASE_INPUT.midpoint.lat + index * 0.001,
          lng: BASE_INPUT.midpoint.lng + index * 0.001,
        },
      });
    }

    await expect(
      searchRoomVenues({
        ...BASE_INPUT,
        midpoint: {
          lat: -6.45,
          lng: 107.12,
        },
      }),
    ).rejects.toBeInstanceOf(VenueSearchRateLimitError);
  });
});
