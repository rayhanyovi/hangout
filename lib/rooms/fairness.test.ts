import { describe, expect, it } from "vitest";
import { buildMidpointFairnessSummary, estimateTravelMinutes } from "@/lib/rooms";

describe("buildMidpointFairnessSummary", () => {
  it("computes midpoint and fairness metrics for multiple members", () => {
    const summary = buildMidpointFairnessSummary(
      [
        { id: "a", name: "A", lat: 0, lng: 0 },
        { id: "b", name: "B", lat: 0, lng: 2 },
      ],
      "motor",
    );

    expect(summary.midpoint).toEqual({ lat: 0, lng: 1 });
    expect(summary.rows).toHaveLength(2);
    expect(summary.rows[0]?.etaMin).toBeGreaterThan(0);
    expect(summary.averageDistanceKm).not.toBeNull();
    expect(summary.averageEtaMin).not.toBeNull();
    expect(summary.furthestDistanceKm).not.toBeNull();
    expect(summary.spreadKm).toBe(0);
    expect(summary.spreadEtaMin).toBe(0);
    expect(summary.transportMode).toBe("motor");
  });

  it("returns an empty summary when fewer than two members are located", () => {
    const summary = buildMidpointFairnessSummary(
      [{ id: "a", name: "A", lat: 0, lng: 0 }],
      "walk",
    );

    expect(summary.midpoint).toBeNull();
    expect(summary.rows).toEqual([]);
    expect(summary.averageDistanceKm).toBeNull();
    expect(summary.averageEtaMin).toBeNull();
    expect(summary.transportMode).toBe("walk");
  });

  it("uses different ETA profiles per transport mode", () => {
    expect(estimateTravelMinutes(3, "walk")).toBeGreaterThan(
      estimateTravelMinutes(3, "motor"),
    );
    expect(estimateTravelMinutes(3, "transit")).toBeGreaterThan(
      estimateTravelMinutes(3, "motor"),
    );
  });
});
