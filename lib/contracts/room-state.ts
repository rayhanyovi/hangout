import type { MemberId, RoomStatus, VenueId } from "@/lib/contracts/domain";

export const ROOM_STATE_EVENTS = [
  "room_created",
  "venue_finalized",
  "room_expired",
  "room_reopened",
] as const;

export type RoomStateEvent = (typeof ROOM_STATE_EVENTS)[number];

export type RoomStateTransitionContext = {
  actorMemberId?: MemberId;
  venueId?: VenueId;
  nowIso: string;
};

export type RoomStateTransitionResult = {
  status: RoomStatus;
  finalizedAt?: string;
  finalizedByMemberId?: MemberId;
  finalizedVenueId?: VenueId;
};

const ROOM_STATE_TRANSITIONS: Record<
  RoomStatus,
  Partial<Record<RoomStateEvent, RoomStatus>>
> = {
  open: {
    room_created: "open",
    venue_finalized: "finalized",
    room_expired: "expired",
  },
  finalized: {
    room_expired: "expired",
    room_reopened: "open",
  },
  expired: {},
};

export function canTransitionRoomState(
  currentStatus: RoomStatus,
  event: RoomStateEvent,
) {
  return Boolean(ROOM_STATE_TRANSITIONS[currentStatus][event]);
}

export function transitionRoomState(
  currentStatus: RoomStatus,
  event: RoomStateEvent,
  context: RoomStateTransitionContext,
): RoomStateTransitionResult {
  const nextStatus = ROOM_STATE_TRANSITIONS[currentStatus][event];

  if (!nextStatus) {
    throw new Error(
      `Invalid room state transition from ${currentStatus} via ${event}`,
    );
  }

  if (event === "venue_finalized") {
    if (!context.actorMemberId || !context.venueId) {
      throw new Error("Finalizing a room requires actorMemberId and venueId");
    }

    return {
      status: nextStatus,
      finalizedAt: context.nowIso,
      finalizedByMemberId: context.actorMemberId,
      finalizedVenueId: context.venueId,
    };
  }

  return {
    status: nextStatus,
  };
}

export function isRoomTerminal(status: RoomStatus) {
  return status === "expired";
}

export function isRoomEditable(status: RoomStatus) {
  return status === "open";
}
