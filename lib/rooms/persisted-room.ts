import type { DraftRoomSeed } from "@/lib/rooms/draft-room";
import type { DraftRoomMember } from "@/lib/rooms/member-preview";
import type { Member, RoomSnapshot } from "@/lib/contracts";

export function buildDraftRoomSeedFromSnapshot(snapshot: RoomSnapshot): DraftRoomSeed {
  const hostMember =
    snapshot.members.find((member) => member.role === "host") ?? snapshot.members[0];

  return {
    title: snapshot.room.title,
    hostDisplayName: hostMember?.displayName ?? "Host",
    guestDisplayName: undefined,
    transportMode: snapshot.room.transportMode,
    privacyMode: snapshot.room.privacyMode,
    categories: snapshot.room.venuePreferences.categories,
    tags: snapshot.room.venuePreferences.tags,
    budget: snapshot.room.venuePreferences.budget,
    radiusMDefault: snapshot.room.venuePreferences.radiusMDefault,
    previewMode: false,
  };
}

function buildMemberStatusLabel(member: Member) {
  if (member.role === "host" && member.location) {
    return "Host shared a location";
  }

  if (member.location) {
    return "Location shared";
  }

  return member.role === "host"
    ? "Host is setting up the room"
    : "Waiting to share a location";
}

export function mapSnapshotMembersToDraftMembers(
  snapshot: RoomSnapshot,
): DraftRoomMember[] {
  return snapshot.members.map((member) => ({
    id: member.memberId,
    displayName: member.displayName,
    role: member.role,
    statusLabel: buildMemberStatusLabel(member),
    location: member.location,
  }));
}
