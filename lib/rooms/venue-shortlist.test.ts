import { describe, expect, it } from "vitest";
import { filterRankedVenues, rankVenuesForRoom } from "@/lib/rooms";

describe("rankVenuesForRoom", () => {
  it("scores and sorts venues by room preferences", () => {
    const venues = rankVenuesForRoom(
      [
        {
          venueId: "1",
          providerId: "1",
          name: "Closer Cafe",
          category: "cafe",
          lat: -6.2,
          lng: 106.8,
          address: null,
          distanceToCenterM: 120,
          tags: ["wifi", "cozy"],
          mapUrl: "https://maps.example/1",
        },
        {
          venueId: "2",
          providerId: "2",
          name: "Farther Cafe",
          category: "cafe",
          lat: -6.21,
          lng: 106.81,
          address: null,
          distanceToCenterM: 850,
          tags: ["outdoor"],
          mapUrl: "https://maps.example/2",
        },
      ],
      {
        categories: ["cafe"],
        tags: ["wifi"],
        radiusMDefault: 1000,
      },
    );

    expect(venues).toHaveLength(2);
    expect(venues[0]?.name).toBe("Closer Cafe");
    expect(venues[0]?.matchedTags).toEqual(["wifi"]);
    expect(venues[0]?.score).toBeGreaterThan(venues[1]?.score ?? 0);
  });
});

describe("filterRankedVenues", () => {
  it("keeps only venues from active categories when filters are set", () => {
    const filtered = filterRankedVenues(
      [
        {
          venueId: "1",
          providerId: "1",
          name: "Closer Cafe",
          category: "cafe",
          lat: -6.2,
          lng: 106.8,
          address: null,
          distanceToCenterM: 120,
          tags: ["wifi"],
          mapUrl: "https://maps.example/1",
          matchedTags: ["wifi"],
          score: 92,
        },
        {
          venueId: "2",
          providerId: "2",
          name: "Green Park",
          category: "park",
          lat: -6.2,
          lng: 106.8,
          address: null,
          distanceToCenterM: 320,
          tags: ["outdoor"],
          mapUrl: "https://maps.example/2",
          matchedTags: [],
          score: 76,
        },
      ],
      ["park"],
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.category).toBe("park");
  });
});
