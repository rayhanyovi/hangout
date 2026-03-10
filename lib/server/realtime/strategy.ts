export const REALTIME_STRATEGY = {
  mode: "polling",
  pollIntervalSeconds: 4,
  clientRefreshTriggers: [
    "member_joined",
    "location_updated",
    "midpoint_computed",
    "venues_updated",
    "vote_updated",
    "room_finalized",
  ] as const,
  upgradePath: "swap polling transport with realtime provider after MVP validation",
  rationale:
    "Polling keeps the MVP operationally simple while preserving a clear contract for room state refresh.",
} as const;
