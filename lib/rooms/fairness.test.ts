import { describe, expect, it } from "vitest";
import {
  applyFairnessEta,
  buildMidpointFairnessSummary,
  estimateTravelMinutes,
} from "@/lib/rooms";

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
    expect(summary.etaSource).toBe("heuristic");
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

  it("can replace heuristic ETA rows with provider-backed durations", () => {
    const summary = buildMidpointFairnessSummary(
      [
        { id: "a", name: "A", lat: -6.2, lng: 106.8 },
        { id: "b", name: "B", lat: -6.2, lng: 106.84 },
      ],
      "car",
    );
    const enriched = applyFairnessEta(summary, {
      rows: [
        { id: "a", etaMin: 14.2 },
        { id: "b", etaMin: 18.8 },
      ],
      source: "mapbox",
      providerLabel: "Mapbox Matrix driving-traffic",
      note: "Route durations are fetched from Mapbox Matrix.",
    });

    expect(enriched.rows.map((row) => row.etaMin)).toEqual([14.2, 18.8]);
    expect(enriched.averageEtaMin).toBe(16.5);
    expect(enriched.spreadEtaMin).toBeCloseTo(4.6);
    expect(enriched.etaSource).toBe("mapbox");
    expect(enriched.etaProviderLabel).toBe("Mapbox Matrix driving-traffic");
  });
});
