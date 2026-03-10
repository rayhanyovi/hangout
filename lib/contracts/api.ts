import type {
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
  "add_room_member",
  "get_room_snapshot",
  "update_member_location",
  "compute_midpoint",
  "cast_vote",
  "finalize_room",
] as const;

export type CreateRoomInput = {
  title: string | null;
  description?: string | null;
  scheduledLabel?: string | null;
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

export type AddRoomMemberInput = {
  roomId: RoomId;
  actorMemberId: MemberId;
  displayName: string;
};

export type AddRoomMemberOutput = {
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
  actorMemberId: MemberId;
  memberId: MemberId;
  location: MemberLocation;
};

export type UpdateMemberLocationOutput = {
  snapshot: RoomSnapshot;
};

export type UpdateRoomDetailsInput = {
  roomId: RoomId;
  actorMemberId: MemberId;
  title?: string | null;
  description?: string | null;
  scheduledLabel?: string | null;
};

export type UpdateRoomDetailsOutput = {
  snapshot: RoomSnapshot;
};

export type ComputeMidpointInput = {
  roomId: RoomId;
};

export type ComputeMidpointOutput = {
  midpoint: Midpoint;
  snapshot: RoomSnapshot;
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
