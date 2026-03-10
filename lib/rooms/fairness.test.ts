import { describe, expect, it } from "vitest";
import { buildMidpointFairnessSummary } from "@/lib/rooms";

describe("buildMidpointFairnessSummary", () => {
  it("computes midpoint and fairness metrics for multiple members", () => {
    const summary = buildMidpointFairnessSummary([
      { id: "a", name: "A", lat: 0, lng: 0 },
      { id: "b", name: "B", lat: 0, lng: 2 },
    ]);

    expect(summary.midpoint).toEqual({ lat: 0, lng: 1 });
    expect(summary.rows).toHaveLength(2);
    expect(summary.averageDistanceKm).not.toBeNull();
    expect(summary.furthestDistanceKm).not.toBeNull();
    expect(summary.spreadKm).toBe(0);
  });

  it("returns an empty summary when fewer than two members are located", () => {
    const summary = buildMidpointFairnessSummary([
      { id: "a", name: "A", lat: 0, lng: 0 },
    ]);

    expect(summary.midpoint).toBeNull();
    expect(summary.rows).toEqual([]);
    expect(summary.averageDistanceKm).toBeNull();
  });
});
