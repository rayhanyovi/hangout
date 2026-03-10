export const PERSISTENCE_STRATEGY = {
  engine: "postgresql",
  accessPattern: "server-only repository layer",
  dataModel: "normalized relational tables",
  primaryTables: ["rooms", "members", "votes", "venues_cache"] as const,
  roomTtlHours: 24,
  cleanupMode: "scheduled cleanup worker",
  cleanupCadenceMinutes: 15,
  roomExpiryField: "expires_at",
  rationale:
    "Rooms, members, and votes are relational, short-lived, and need predictable querying for room hydration and cleanup.",
} as const;
