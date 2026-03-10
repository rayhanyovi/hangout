import { describe, expect, it } from "vitest";
import { computeGeometricMedian, haversineKm } from "@/lib/math";

describe("geo utilities", () => {
  it("returns zero distance for identical coordinates", () => {
    expect(haversineKm({ lat: -6.2, lng: 106.8 }, { lat: -6.2, lng: 106.8 })).toBe(
      0,
    );
  });

  it("finds a midpoint near the average for two points", () => {
    const midpoint = computeGeometricMedian([
      { lat: -6.2, lng: 106.8 },
      { lat: -6.24, lng: 106.84 },
    ]);

    expect(midpoint).not.toBeNull();
    expect(midpoint?.lat).toBeCloseTo(-6.22, 3);
    expect(midpoint?.lng).toBeCloseTo(106.82, 3);
  });
});
