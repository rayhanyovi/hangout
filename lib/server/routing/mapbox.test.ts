// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  buildMapboxMatrixRequestUrl,
  getMapboxProfileForTransportMode,
} from "@/lib/server/routing/mapbox";

describe("Mapbox routing helpers", () => {
  it("maps supported transport modes to matrix profiles", () => {
    expect(getMapboxProfileForTransportMode("walk")?.profilePath).toBe(
      "mapbox/walking",
    );
    expect(getMapboxProfileForTransportMode("motor")?.profilePath).toBe(
      "mapbox/driving",
    );
    expect(getMapboxProfileForTransportMode("car")?.profilePath).toBe(
      "mapbox/driving-traffic",
    );
    expect(getMapboxProfileForTransportMode("transit")).toBeNull();
  });

  it("builds a matrix request with explicit sources and destination", () => {
    const url = new URL(
      buildMapboxMatrixRequestUrl({
        accessToken: "test-token",
        coordinates: [
          { lat: -6.2, lng: 106.8 },
          { lat: -6.21, lng: 106.82 },
          { lat: -6.205, lng: 106.81 },
        ],
        destinationIndex: 2,
        profilePath: "mapbox/driving",
        sourceIndexes: [0, 1],
      }),
    );

    expect(url.pathname).toContain("/directions-matrix/v1/mapbox/driving/");
    expect(url.searchParams.get("annotations")).toBe("duration");
    expect(url.searchParams.get("sources")).toBe("0;1");
    expect(url.searchParams.get("destinations")).toBe("2");
    expect(url.searchParams.get("access_token")).toBe("test-token");
  });
});
