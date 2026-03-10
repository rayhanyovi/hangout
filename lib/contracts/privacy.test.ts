import { describe, expect, it } from "vitest";
import { applyPrivacyModeToLocation, roundCoordinate } from "@/lib/contracts";

describe("privacy contracts", () => {
  it("rounds coordinates to the configured precision", () => {
    expect(roundCoordinate(-6.2088123, 3)).toBe(-6.209);
    expect(roundCoordinate(106.8456123, 5)).toBe(106.84561);
  });

  it("applies approximate privacy before storing location data", () => {
    const location = applyPrivacyModeToLocation(
      {
        lat: -6.2088123,
        lng: 106.8456123,
        source: "gps",
        accuracyM: 18,
        updatedAt: "2026-03-10T00:00:00.000Z",
      },
      "approximate",
    );

    expect(location.lat).toBe(-6.209);
    expect(location.lng).toBe(106.846);
  });
});
