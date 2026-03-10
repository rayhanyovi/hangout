import type {
  Coordinate,
  FinalizedDecision,
  JoinCode,
  Member,
  MemberId,
  MemberLocation,
  Midpoint,
  PrivacyMode,
  Room,
  RoomId,
  RoomSnapshot,
  TransportMode,
  VenueId,
  VenuePreferences,
  Vote,
} from "@/lib/contracts/domain";

export const ROOM_FLOW_OPERATIONS = [
  "create_room",
  "join_room",
  "get_room_snapshot",
  "update_member_location",
  "compute_midpoint",
  "cast_vote",
  "finalize_room",
] as const;

export type CreateRoomInput = {
  title: string | null;
  hostDisplayName: string;
  transportMode: TransportMode;
  privacyMode: PrivacyMode;
  venuePreferences: VenuePreferences;
};

export type CreateRoomOutput = {
  room: Room;
  hostMember: Member;
  shareUrl: string;
};

export type JoinRoomInput = {
  joinCode: JoinCode;
  displayName: string;
};

export type JoinRoomOutput = {
  room: Room;
  member: Member;
  snapshot: RoomSnapshot;
};

export type GetRoomSnapshotInput = {
  joinCode: JoinCode;
  memberId?: MemberId;
};

export type GetRoomSnapshotOutput = RoomSnapshot;

export type UpdateMemberLocationInput = {
  roomId: RoomId;
  memberId: MemberId;
  location: MemberLocation;
};

export type UpdateMemberLocationOutput = {
  snapshot: RoomSnapshot;
};

export type ComputeMidpointInput = {
  roomId: RoomId;
};

export type ComputeMidpointOutput = {
  midpoint: Midpoint;
  snapshot: RoomSnapshot;
};

export type FairnessEtaInput = {
  midpoint: Coordinate;
  members: Array<
    {
      id: MemberId;
      name: string;
    } & Coordinate
  >;
  transportMode: TransportMode;
  joinCode?: JoinCode;
};

export type FairnessEtaOutput = {
  rows: Array<{
    id: MemberId;
    etaMin: number;
  }>;
  transportMode: TransportMode;
  source: "heuristic" | "mapbox";
  providerLabel: string;
  note: string | null;
  cacheStatus: "hit" | "miss" | "stale";
};

export type CastVoteInput = {
  roomId: RoomId;
  memberId: MemberId;
  venueId: VenueId;
  reaction?: string;
  comment?: string;
};

export type CastVoteOutput = {
  vote: Vote;
  snapshot: RoomSnapshot;
};

export type FinalizeRoomInput = {
  roomId: RoomId;
  memberId: MemberId;
  venueId: VenueId;
};

export type FinalizeRoomOutput = {
  decision: FinalizedDecision;
  snapshot: RoomSnapshot;
};
