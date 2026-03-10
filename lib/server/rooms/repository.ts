import "server-only";

import type {
  AddRoomMemberOutput,
  CastVoteOutput,
  CreateRoomInput,
  CreateRoomOutput,
  FinalizeRoomOutput,
  GetRoomSnapshotOutput,
  JoinRoomInput,
  JoinRoomOutput,
  MemberLocation,
  UpdateRoomDetailsOutput,
  UpdateMemberLocationOutput,
  Venue,
} from "@/lib/contracts";
import { isPostgresConfigured } from "@/lib/server/db/client";
import * as fileRepository from "@/lib/server/rooms/file-repository";
import * as postgresRepository from "@/lib/server/rooms/postgres-repository";

function getRepository() {
  return isPostgresConfigured() ? postgresRepository : fileRepository;
}

export async function createRoom(
  input: CreateRoomInput,
  origin: string,
): Promise<CreateRoomOutput> {
  return getRepository().createRoom(input, origin);
}

export async function cleanupExpiredRooms() {
  return getRepository().cleanupExpiredRooms();
}

export async function joinRoom(input: JoinRoomInput): Promise<JoinRoomOutput> {
  return getRepository().joinRoom(input);
}

export async function addRoomMember(
  joinCode: string,
  actorMemberId: string,
  displayName: string,
): Promise<AddRoomMemberOutput> {
  return getRepository().addRoomMember(joinCode, actorMemberId, displayName);
}

export async function getRoomSnapshot(
  joinCode: string,
): Promise<GetRoomSnapshotOutput | null> {
  return getRepository().getRoomSnapshot(joinCode);
}

export async function updateMemberLocation(
  joinCode: string,
  actorMemberId: string,
  memberId: string,
  location: MemberLocation,
): Promise<UpdateMemberLocationOutput> {
  return getRepository().updateMemberLocation(
    joinCode,
    actorMemberId,
    memberId,
    location,
  );
}

export async function updateRoomDetails(
  joinCode: string,
  actorMemberId: string,
  details: {
    title?: string | null;
    description?: string | null;
    scheduledLabel?: string | null;
  },
): Promise<UpdateRoomDetailsOutput> {
  return getRepository().updateRoomDetails(joinCode, actorMemberId, details);
}

export async function setRoomVenueCache(joinCode: string, venues: Venue[]) {
  return getRepository().setRoomVenueCache(joinCode, venues);
}

export async function castVote(
  joinCode: string,
  memberId: string,
  venueId: string,
  reaction?: string,
  comment?: string,
): Promise<CastVoteOutput> {
  return getRepository().castVote(
    joinCode,
    memberId,
    venueId,
    reaction,
    comment,
  );
}

export async function finalizeRoom(
  joinCode: string,
  memberId: string,
  venueId: string,
  origin: string,
): Promise<FinalizeRoomOutput> {
  return getRepository().finalizeRoom(joinCode, memberId, venueId, origin);
}
