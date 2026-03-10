import "server-only";

import type { Coordinate, FairnessEtaInput, FairnessEtaOutput, TransportMode } from "@/lib/contracts";
import { haversineKm } from "@/lib/math";
import { estimateTravelMinutes } from "@/lib/rooms";

type MapboxProfile = {
  profilePath: "mapbox/driving" | "mapbox/driving-traffic" | "mapbox/walking";
  maxCoordinates: number;
  label: string;
  note: string | null;
  fixtureMultiplier: number;
};

type MapboxMatrixResponse = {
  code: string;
  durations?: Array<Array<number | null>>;
  message?: string;
};

const MAPBOX_PROFILES: Partial<Record<TransportMode, MapboxProfile>> = {
  walk: {
    profilePath: "mapbox/walking",
    maxCoordinates: 25,
    label: "Mapbox Matrix walking",
    note: "Route durations are fetched from Mapbox Matrix for walking paths.",
    fixtureMultiplier: 1.04,
  },
  motor: {
    profilePath: "mapbox/driving",
    maxCoordinates: 25,
    label: "Mapbox Matrix driving proxy",
    note: "Motorbike ETA uses the Mapbox driving profile as the closest available proxy.",
    fixtureMultiplier: 1.08,
  },
  car: {
    profilePath: "mapbox/driving-traffic",
    maxCoordinates: 10,
    label: "Mapbox Matrix driving-traffic",
    note: "Car ETA uses the Mapbox driving-traffic profile for route-duration estimates.",
    fixtureMultiplier: 1.12,
  },
};

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function chunkMembers<T>(members: T[], size: number) {
  if (size <= 0) {
    return [members];
  }

  const chunks: T[][] = [];

  for (let index = 0; index < members.length; index += size) {
    chunks.push(members.slice(index, index + size));
  }

  return chunks;
}

function formatCoordinates(coordinates: Coordinate[]) {
  return coordinates.map((coordinate) => `${coordinate.lng},${coordinate.lat}`).join(";");
}

export function getMapboxProfileForTransportMode(transportMode: TransportMode) {
  return MAPBOX_PROFILES[transportMode] ?? null;
}

export function buildMapboxMatrixRequestUrl({
  accessToken,
  coordinates,
  destinationIndex,
  profilePath,
  sourceIndexes,
}: {
  accessToken: string;
  coordinates: Coordinate[];
  destinationIndex: number;
  profilePath: MapboxProfile["profilePath"];
  sourceIndexes: number[];
}) {
  const params = new URLSearchParams({
    access_token: accessToken,
    annotations: "duration",
    destinations: String(destinationIndex),
    sources: sourceIndexes.join(";"),
  });

  if (profilePath === "mapbox/driving-traffic") {
    params.set("depart_at", new Date().toISOString());
  }

  return `https://api.mapbox.com/directions-matrix/v1/${profilePath}/${formatCoordinates(
    coordinates,
  )}?${params.toString()}`;
}

function buildFixtureDurationSeconds(
  midpoint: Coordinate,
  member: FairnessEtaInput["members"][number],
  transportMode: TransportMode,
  multiplier: number,
) {
  return (
    estimateTravelMinutes(haversineKm(midpoint, member), transportMode) *
    60 *
    multiplier
  );
}

async function fetchMapboxMatrixDurations(
  url: string,
  signal?: AbortSignal,
) {
  const response = await fetch(url, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Mapbox Matrix request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as MapboxMatrixResponse;

  if (payload.code !== "Ok" || !payload.durations) {
    throw new Error(payload.message ?? "Mapbox Matrix returned an invalid response.");
  }

  return payload.durations;
}

export async function fetchMapboxFairnessEta(
  input: Pick<FairnessEtaInput, "midpoint" | "members" | "transportMode"> & {
    accessToken: string;
    fixtureMode?: boolean;
    signal?: AbortSignal;
  },
): Promise<
  Omit<FairnessEtaOutput, "cacheStatus">
> {
  const profile = getMapboxProfileForTransportMode(input.transportMode);

  if (!profile) {
    throw new Error(
      "Mapbox Matrix does not provide a transit matrix profile for this transport mode.",
    );
  }

  const maxOriginsPerRequest = profile.maxCoordinates - 1;
  const memberChunks = chunkMembers(input.members, maxOriginsPerRequest);
  const rows: FairnessEtaOutput["rows"] = [];
  let fallbackCount = 0;

  for (const chunk of memberChunks) {
    const coordinates = [...chunk, input.midpoint];
    const destinationIndex = chunk.length;
    let durations: Array<Array<number | null>>;

    if (input.fixtureMode) {
      durations = chunk.map((member) => [
        buildFixtureDurationSeconds(
          input.midpoint,
          member,
          input.transportMode,
          profile.fixtureMultiplier,
        ),
      ]);
    } else {
      durations = await fetchMapboxMatrixDurations(
        buildMapboxMatrixRequestUrl({
          accessToken: input.accessToken,
          coordinates,
          destinationIndex,
          profilePath: profile.profilePath,
          sourceIndexes: chunk.map((_, index) => index),
        }),
        input.signal,
      );
    }

    chunk.forEach((member, index) => {
      const durationSeconds = durations[index]?.[0];
      const fallbackEtaMin = estimateTravelMinutes(
        haversineKm(input.midpoint, member),
        input.transportMode,
      );

      if (typeof durationSeconds !== "number" || Number.isNaN(durationSeconds)) {
        fallbackCount += 1;
        rows.push({
          id: member.id,
          etaMin: fallbackEtaMin,
        });
        return;
      }

      rows.push({
        id: member.id,
        etaMin: Math.max(1, roundToSingleDecimal(durationSeconds / 60)),
      });
    });
  }

  const fallbackSuffix =
    fallbackCount > 0
      ? ` ${fallbackCount} member route(s) fell back to the heuristic ETA model.`
      : "";
  const fixtureSuffix = input.fixtureMode
    ? " Fixture mode is enabled for deterministic local test coverage."
    : "";

  return {
    rows,
    transportMode: input.transportMode,
    source: "mapbox",
    providerLabel: profile.label,
    note: `${profile.note ?? ""}${fallbackSuffix}${fixtureSuffix}`.trim() || null,
  };
}
