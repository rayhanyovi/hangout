import type { Coordinate } from "@/lib/contracts";
import { computeGeometricMedian, haversineKm } from "@/lib/math";

export type FairnessMemberInput = Coordinate & {
  id: string;
  name: string;
};

export type FairnessSummaryRow = {
  id: string;
  name: string;
  distanceKm: number;
};

export type FairnessSummary = {
  midpoint: Coordinate | null;
  rows: FairnessSummaryRow[];
  averageDistanceKm: number | null;
  furthestDistanceKm: number | null;
  spreadKm: number | null;
};

export function buildMidpointFairnessSummary(
  members: FairnessMemberInput[],
): FairnessSummary {
  if (members.length < 2) {
    return {
      midpoint: null,
      rows: [],
      averageDistanceKm: null,
      furthestDistanceKm: null,
      spreadKm: null,
    };
  }

  const midpoint = computeGeometricMedian(members);

  if (!midpoint) {
    return {
      midpoint: null,
      rows: [],
      averageDistanceKm: null,
      furthestDistanceKm: null,
      spreadKm: null,
    };
  }

  const rows = members.map((member) => ({
    id: member.id,
    name: member.name,
    distanceKm: haversineKm(midpoint, member),
  }));
  const distances = rows.map((row) => row.distanceKm);
  const totalDistanceKm = distances.reduce((sum, distance) => sum + distance, 0);
  const furthestDistanceKm = Math.max(...distances);
  const closestDistanceKm = Math.min(...distances);

  return {
    midpoint,
    rows,
    averageDistanceKm: totalDistanceKm / rows.length,
    furthestDistanceKm,
    spreadKm: furthestDistanceKm - closestDistanceKm,
  };
}
