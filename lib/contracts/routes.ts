export const MVP_STATIC_ROUTES = {
  home: "/",
  newRoom: "/rooms/new",
} as const;

export function getRoomRoute(joinCode: string) {
  return `/r/${joinCode}`;
}

export function getRoomDecisionRoute(joinCode: string) {
  return `${getRoomRoute(joinCode)}/decision`;
}

export const MVP_ROUTE_NOTES = [
  {
    path: MVP_STATIC_ROUTES.home,
    purpose: "Landing page and product framing",
  },
  {
    path: MVP_STATIC_ROUTES.newRoom,
    purpose: "Host setup flow for creating a new room",
  },
  {
    path: "/r/[joinCode]",
    purpose: "Shared room experience for join, location sharing, midpoint, venues, voting, and finalization",
  },
  {
    path: "/r/[joinCode]/decision",
    purpose: "Finalized decision summary and maps handoff",
  },
] as const;
