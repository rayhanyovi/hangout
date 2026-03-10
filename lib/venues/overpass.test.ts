import { describe, expect, it } from "vitest";
import {
  buildOverpassQuery,
  normalizeOverpassVenue,
} from "@/lib/venues/overpass";

describe("buildOverpassQuery", () => {
  it("includes nodes, ways, and relations for requested categories", () => {
    const query = buildOverpassQuery(
      {
        lat: -6.2,
        lng: 106.8,
      },
      1500,
      ["park"],
    );

    expect(query).toContain('node["leisure"~"park|garden|playground"]');
    expect(query).toContain('way["leisure"~"park|garden|playground"]');
    expect(query).toContain('relation["leisure"~"park|garden|playground"]');
  });
});

describe("normalizeOverpassVenue", () => {
  it("builds OpenStreetMap links for normalized venues", () => {
    const venue = normalizeOverpassVenue(
      {
        id: 42,
        lat: -6.2,
        lon: 106.8,
        tags: {
          amenity: "cafe",
          name: "Kopi Tengah",
        },
      },
      {
        lat: -6.2,
        lng: 106.8,
      },
    );

    expect(venue?.mapUrl).toBe(
      "https://www.openstreetmap.org/?mlat=-6.2&mlon=106.8#map=18/-6.2/106.8",
    );
  });
});
