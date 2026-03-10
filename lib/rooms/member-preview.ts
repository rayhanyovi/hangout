import type {
  Coordinate,
  LocationSource,
  MemberLocation,
  Role,
} from "@/lib/contracts";
import type { DraftRoomSeed } from "@/lib/rooms/draft-room";

export type DraftRoomMember = {
  id: string;
  displayName: string;
  role: Role;
  statusLabel: string;
  location: MemberLocation | null;
};

const PREVIEW_MEMBER_COORDINATES: Coordinate[] = [
  { lat: -6.2088, lng: 106.8456 },
  { lat: -6.1967, lng: 106.8247 },
  { lat: -6.1894, lng: 106.8229 },
];
const PREVIEW_LOCATION_UPDATED_AT = "2026-03-10T00:00:00.000Z";

function createPreviewLocation(
  coordinate: Coordinate,
  source: LocationSource,
): MemberLocation {
  return {
    ...coordinate,
    source,
    updatedAt: PREVIEW_LOCATION_UPDATED_AT,
    accuracyM: source === "gps" ? 45 : 120,
  };
}

export function buildDraftRoomMembers(seed: DraftRoomSeed): DraftRoomMember[] {
  const host: DraftRoomMember = {
    id: "host",
    displayName: seed.hostDisplayName,
    role: "host",
    statusLabel: "Host siap memulai",
    location: createPreviewLocation(PREVIEW_MEMBER_COORDINATES[0], "gps"),
  };

  const guest: DraftRoomMember = seed.guestDisplayName
    ? {
        id: "guest",
        displayName: seed.guestDisplayName,
        role: "member",
        statusLabel: "Sudah masuk ke room",
        location: createPreviewLocation(PREVIEW_MEMBER_COORDINATES[1], "search"),
      }
    : {
        id: "invite-slot",
        displayName: "Menunggu anggota",
        role: "member",
        statusLabel: "Belum ada anggota lain yang masuk",
        location: null,
      };

  const previewMember: DraftRoomMember = {
    id: "member-3",
    displayName: "Anggota 3",
    role: "member",
    statusLabel: "Sudah siap ikut menentukan lokasi",
    location: createPreviewLocation(PREVIEW_MEMBER_COORDINATES[2], "pinned"),
  };

  return [host, guest, previewMember];
}

export function createPendingDraftRoomMember(
  displayName: string,
): DraftRoomMember {
  return {
    id: `member-${crypto.randomUUID().slice(0, 8)}`,
    displayName,
    role: "member",
    statusLabel: "Baru ditambahkan ke room",
    location: null,
  };
}

export function memberHasLocation(
  member: DraftRoomMember,
): member is DraftRoomMember & { location: MemberLocation } {
  return member.location !== null;
}
