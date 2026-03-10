import type {
  MemberLocation,
  PrivacyMode,
} from "@/lib/contracts/domain";

export const LOCATION_RETENTION_POLICY = {
  roomTtlHours: 24,
  exactModeDecimals: 5,
  approximateModeDecimals: 3,
  cleanupWindowMinutes: 15,
} as const;

export const PRIVACY_RULES = {
  exact: {
    locationPrecisionDecimals: LOCATION_RETENTION_POLICY.exactModeDecimals,
    storeExactCoordinate: true,
    description:
      "Lokasi disimpan lebih presisi selama room masih aktif.",
  },
  approximate: {
    locationPrecisionDecimals: LOCATION_RETENTION_POLICY.approximateModeDecimals,
    storeExactCoordinate: false,
    description:
      "Lokasi dibulatkan sebelum disimpan supaya yang dibagikan adalah area, bukan titik persisnya.",
  },
} as const satisfies Record<
  PrivacyMode,
  {
    locationPrecisionDecimals: number;
    storeExactCoordinate: boolean;
    description: string;
  }
>;

export function roundCoordinate(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function applyPrivacyModeToLocation(
  location: MemberLocation,
  privacyMode: PrivacyMode,
): MemberLocation {
  const decimals = PRIVACY_RULES[privacyMode].locationPrecisionDecimals;

  return {
    ...location,
    lat: roundCoordinate(location.lat, decimals),
    lng: roundCoordinate(location.lng, decimals),
  };
}
