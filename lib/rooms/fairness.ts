import type { Coordinate, TransportMode } from "@/lib/contracts";
import { computeGeometricMedian, haversineKm } from "@/lib/math";

export type FairnessMemberInput = Coordinate & {
  id: string;
  name: string;
};

export type FairnessSummaryRow = {
  id: string;
  name: string;
  distanceKm: number;
  etaMin: number;
};

export type FairnessSummary = {
  midpoint: Coordinate | null;
  rows: FairnessSummaryRow[];
  averageDistanceKm: number | null;
  furthestDistanceKm: number | null;
  spreadKm: number | null;
  averageEtaMin: number | null;
  furthestEtaMin: number | null;
  spreadEtaMin: number | null;
  transportMode: TransportMode;
};

export const TRANSPORT_ETA_PROFILES: Record<
  TransportMode,
  {
    averageSpeedKmh: number;
    fixedDelayMin: number;
    label: string;
  }
> = {
  walk: {
    averageSpeedKmh: 4.8,
    fixedDelayMin: 0,
    label: "Walking pace",
  },
  motor: {
    averageSpeedKmh: 26,
    fixedDelayMin: 4,
    label: "Motorbike city pace",
  },
  car: {
    averageSpeedKmh: 18,
    fixedDelayMin: 6,
    label: "Car city pace",
  },
  transit: {
    averageSpeedKmh: 14,
    fixedDelayMin: 8,
    label: "Transit with wait buffer",
  },
};

export function estimateTravelMinutes(
  distanceKm: number,
  transportMode: TransportMode,
) {
  const profile = TRANSPORT_ETA_PROFILES[transportMode];
  const travelMinutes = (distanceKm / profile.averageSpeedKmh) * 60;

  return Math.max(
    transportMode === "walk" ? 1 : profile.fixedDelayMin,
    Math.round((travelMinutes + profile.fixedDelayMin) * 10) / 10,
  );
}

export function buildMidpointFairnessSummary(
  members: FairnessMemberInput[],
  transportMode: TransportMode = "motor",
): FairnessSummary {
  if (members.length < 2) {
    return {
      midpoint: null,
      rows: [],
      averageDistanceKm: null,
      furthestDistanceKm: null,
      spreadKm: null,
      averageEtaMin: null,
      furthestEtaMin: null,
      spreadEtaMin: null,
      transportMode,
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
      averageEtaMin: null,
      furthestEtaMin: null,
      spreadEtaMin: null,
      transportMode,
    };
  }

  const rows = members.map((member) => ({
    id: member.id,
    name: member.name,
    distanceKm: haversineKm(midpoint, member),
    etaMin: 0,
  }));
  const rowsWithEta = rows.map((row) => ({
    ...row,
    etaMin: estimateTravelMinutes(row.distanceKm, transportMode),
  }));
  const distances = rowsWithEta.map((row) => row.distanceKm);
  const etas = rowsWithEta.map((row) => row.etaMin);
  const totalDistanceKm = distances.reduce((sum, distance) => sum + distance, 0);
  const totalEtaMin = etas.reduce((sum, etaMin) => sum + etaMin, 0);
  const furthestDistanceKm = Math.max(...distances);
  const closestDistanceKm = Math.min(...distances);
  const furthestEtaMin = Math.max(...etas);
  const closestEtaMin = Math.min(...etas);

  return {
    midpoint,
    rows: rowsWithEta,
    averageDistanceKm: totalDistanceKm / rowsWithEta.length,
    furthestDistanceKm,
    spreadKm: furthestDistanceKm - closestDistanceKm,
    averageEtaMin: totalEtaMin / rowsWithEta.length,
    furthestEtaMin,
    spreadEtaMin: furthestEtaMin - closestEtaMin,
    transportMode,
  };
}
