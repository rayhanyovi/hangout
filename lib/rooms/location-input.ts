import {
  applyPrivacyModeToLocation,
  type Coordinate,
  type LocationSource,
  type MemberLocation,
  type PrivacyMode,
} from "@/lib/contracts";
import { updateMemberLocationSchema } from "@/lib/validation";

type CreateValidatedMemberLocationInput = Coordinate & {
  accuracyM?: number;
  nowIso?: string;
  privacyMode: PrivacyMode;
  source: LocationSource;
};

export function createValidatedMemberLocation({
  accuracyM,
  lat,
  lng,
  nowIso = new Date().toISOString(),
  privacyMode,
  source,
}: CreateValidatedMemberLocationInput): MemberLocation {
  const candidate = applyPrivacyModeToLocation(
    {
      accuracyM,
      lat,
      lng,
      source,
      updatedAt: nowIso,
    },
    privacyMode,
  );
  const parsed = updateMemberLocationSchema.shape.location.safeParse(candidate);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Location is not valid.");
  }

  return parsed.data;
}
