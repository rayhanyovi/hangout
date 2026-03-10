export const MIDPOINT_STRATEGY = {
  triggerEvents: [
    "member_location_updated",
    "member_excluded_or_reincluded",
    "transport_mode_updated",
    "room_reopened",
  ] as const,
  minimumLocatedMembers: 2,
  computeMethod: "geometric_median",
  storageMode: "persist latest midpoint snapshot on room record",
  fairnessMode: "store per-member haversine distance for MVP",
  venueRefreshPolicy: "invalidate room venue cache after midpoint changes",
  rationale:
    "Midpoint should be recomputed only when inputs that affect fairness change, then stored on the room so room hydration does not need to recompute on every read.",
} as const;
