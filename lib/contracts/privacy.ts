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
      "Store coordinates with higher precision for the active room window only.",
  },
  approximate: {
    locationPrecisionDecimals: LOCATION_RETENTION_POLICY.approximateModeDecimals,
    storeExactCoordinate: false,
    description:
      "Round coordinates before storage so room members share area-level presence, not exact position.",
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
