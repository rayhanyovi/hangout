import type { Coordinate, FairnessEtaOutput, TransportMode } from "@/lib/contracts";
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
  etaSource: FairnessEtaOutput["source"];
  etaProviderLabel: string;
  etaNote: string | null;
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

function buildEmptySummary(transportMode: TransportMode): FairnessSummary {
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
    etaSource: "heuristic",
    etaProviderLabel: `Heuristic ETA (${TRANSPORT_ETA_PROFILES[transportMode].label})`,
    etaNote: "Estimated from straight-line distance and a fixed transport profile.",
  };
}

function summarizeEtaMetrics(rows: FairnessSummaryRow[]) {
  if (rows.length === 0) {
    return {
      averageEtaMin: null,
      furthestEtaMin: null,
      spreadEtaMin: null,
    };
  }

  const etas = rows.map((row) => row.etaMin);
  const totalEtaMin = etas.reduce((sum, etaMin) => sum + etaMin, 0);
  const furthestEtaMin = Math.max(...etas);
  const closestEtaMin = Math.min(...etas);

  return {
    averageEtaMin: totalEtaMin / rows.length,
    furthestEtaMin,
    spreadEtaMin: furthestEtaMin - closestEtaMin,
  };
}

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

export function applyFairnessEta(
  summary: FairnessSummary,
  etaOutput: Pick<
    FairnessEtaOutput,
    "rows" | "source" | "providerLabel" | "note"
  >,
): FairnessSummary {
  if (summary.rows.length === 0) {
    return {
      ...summary,
      etaSource: etaOutput.source,
      etaProviderLabel: etaOutput.providerLabel,
      etaNote: etaOutput.note,
    };
  }

  const etaById = new Map(
    etaOutput.rows.map((row) => [row.id, row.etaMin] as const),
  );
  const rows = summary.rows.map((row) => ({
    ...row,
    etaMin: etaById.get(row.id) ?? row.etaMin,
  }));
  const etaMetrics = summarizeEtaMetrics(rows);

  return {
    ...summary,
    rows,
    ...etaMetrics,
    etaSource: etaOutput.source,
    etaProviderLabel: etaOutput.providerLabel,
    etaNote: etaOutput.note,
  };
}

export function buildMidpointFairnessSummary(
  members: FairnessMemberInput[],
  transportMode: TransportMode = "motor",
): FairnessSummary {
  if (members.length < 2) {
    return buildEmptySummary(transportMode);
  }

  const midpoint = computeGeometricMedian(members);

  if (!midpoint) {
    return buildEmptySummary(transportMode);
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
  const totalDistanceKm = distances.reduce((sum, distance) => sum + distance, 0);
  const furthestDistanceKm = Math.max(...distances);
  const closestDistanceKm = Math.min(...distances);

  return {
    midpoint,
    rows: rowsWithEta,
    averageDistanceKm: totalDistanceKm / rowsWithEta.length,
    furthestDistanceKm,
    spreadKm: furthestDistanceKm - closestDistanceKm,
    ...summarizeEtaMetrics(rowsWithEta),
    transportMode,
    etaSource: "heuristic",
    etaProviderLabel: `Heuristic ETA (${TRANSPORT_ETA_PROFILES[transportMode].label})`,
    etaNote: "Estimated from straight-line distance and a fixed transport profile.",
  };
}
