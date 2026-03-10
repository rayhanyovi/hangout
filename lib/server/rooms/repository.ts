import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  applyPrivacyModeToLocation,
  getRoomRoute,
  type CreateRoomInput,
  type CreateRoomOutput,
  type GetRoomSnapshotOutput,
  type JoinRoomInput,
  type JoinRoomOutput,
  type Member,
  type MemberLocation,
  type Midpoint,
  type Room,
  type RoomSnapshot,
  type UpdateMemberLocationOutput,
  type Vote,
} from "@/lib/contracts";
import { buildMidpointFairnessSummary } from "@/lib/rooms";
import { LOCATION_RETENTION_POLICY } from "@/lib/contracts/privacy";

type RoomStoreFile = {
  rooms: Room[];
  members: Member[];
  votes: Vote[];
};

const ROOM_STORE_DIRECTORY = path.join(tmpdir(), "hangout");
const ROOM_STORE_FILE = path.join(ROOM_STORE_DIRECTORY, "room-store.json");
const EMPTY_ROOM_STORE: RoomStoreFile = {
  rooms: [],
  members: [],
  votes: [],
};
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function ensureStoreFile() {
  await mkdir(ROOM_STORE_DIRECTORY, { recursive: true });

  try {
    await readFile(ROOM_STORE_FILE, "utf8");
  } catch {
    await writeFile(ROOM_STORE_FILE, JSON.stringify(EMPTY_ROOM_STORE, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();

  const contents = await readFile(ROOM_STORE_FILE, "utf8");
  const parsed = JSON.parse(contents) as RoomStoreFile;

  return pruneExpiredRooms(parsed);
}

async function writeStore(store: RoomStoreFile) {
  await ensureStoreFile();
  await writeFile(ROOM_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function pruneExpiredRooms(store: RoomStoreFile) {
  const now = Date.now();
  const activeRooms = store.rooms.filter(
    (room) => new Date(room.expiresAt).getTime() > now,
  );
  const activeRoomIds = new Set(activeRooms.map((room) => room.roomId));

  return {
    rooms: activeRooms,
    members: store.members.filter((member) => activeRoomIds.has(member.roomId)),
    votes: store.votes.filter((vote) => activeRoomIds.has(vote.roomId)),
  };
}

function buildSnapshot(store: RoomStoreFile, room: Room): RoomSnapshot {
  return {
    room,
    members: store.members.filter((member) => member.roomId === room.roomId),
    venues: [],
    votes: store.votes.filter((vote) => vote.roomId === room.roomId),
  };
}

function computePersistedMidpoint(members: Member[]): Midpoint | null {
  const locatedMembers = members
    .filter((member): member is Member & { location: MemberLocation } => member.location !== null)
    .map((member) => ({
      id: member.memberId,
      name: member.displayName,
      lat: member.location.lat,
      lng: member.location.lng,
    }));

  const fairnessSummary = buildMidpointFairnessSummary(locatedMembers);

  if (!fairnessSummary.midpoint) {
    return null;
  }

  return {
    ...fairnessSummary.midpoint,
    method: "geometric_median",
    computedAt: new Date().toISOString(),
    fairness: fairnessSummary.rows.map((row) => ({
      memberId: row.id,
      distanceKm: row.distanceKm,
    })),
  };
}

function generateJoinCode(existingJoinCodes: Set<string>) {
  let candidate = "";

  do {
    candidate = Array.from({ length: 6 }, () => {
      const index = crypto.randomInt(0, JOIN_CODE_ALPHABET.length);
      return JOIN_CODE_ALPHABET[index];
    }).join("");
  } while (existingJoinCodes.has(candidate));

  return candidate;
}

function createRoomRecord(
  input: CreateRoomInput,
  joinCode: string,
  hostMemberId: string,
): Room {
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + LOCATION_RETENTION_POLICY.roomTtlHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    roomId: crypto.randomUUID(),
    joinCode,
    title: input.title,
    createdAt,
    expiresAt,
    createdByMemberId: hostMemberId,
    transportMode: input.transportMode,
    privacyMode: input.privacyMode,
    venuePreferences: input.venuePreferences,
    midpoint: null,
    finalizedDecision: null,
    status: "open",
  };
}

function createMemberRecord(
  roomId: string,
  displayName: string,
  role: Member["role"],
): Member {
  const nowIso = new Date().toISOString();

  return {
    memberId: crypto.randomUUID(),
    roomId,
    displayName,
    role,
    joinedAt: nowIso,
    lastActiveAt: nowIso,
    location: null,
  };
}

export async function createRoom(
  input: CreateRoomInput,
  origin: string,
): Promise<CreateRoomOutput> {
  const store = await readStore();
  const joinCode = generateJoinCode(new Set(store.rooms.map((room) => room.joinCode)));
  const hostMember = createMemberRecord("pending-room", input.hostDisplayName, "host");
  const room = createRoomRecord(input, joinCode, hostMember.memberId);
  const persistedHostMember = {
    ...hostMember,
    roomId: room.roomId,
  };

  const nextStore = {
    ...store,
    rooms: [...store.rooms, room],
    members: [...store.members, persistedHostMember],
  };

  await writeStore(nextStore);

  return {
    room,
    hostMember: persistedHostMember,
    shareUrl: `${origin}${getRoomRoute(room.joinCode)}`,
  };
}

export async function joinRoom(input: JoinRoomInput): Promise<JoinRoomOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === input.joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== "open") {
    throw new Error("Room is not open for new members.");
  }

  const member = createMemberRecord(room.roomId, input.displayName, "member");
  const nextStore = {
    ...store,
    members: [...store.members, member],
  };

  await writeStore(nextStore);

  return {
    room,
    member,
    snapshot: buildSnapshot(nextStore, room),
  };
}

export async function getRoomSnapshot(
  joinCode: string,
): Promise<GetRoomSnapshotOutput | null> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    return null;
  }

  return buildSnapshot(store, room);
}

export async function updateMemberLocation(
  joinCode: string,
  memberId: string,
  location: MemberLocation,
): Promise<UpdateMemberLocationOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  const nextMembers = store.members.map((member) =>
    member.memberId === memberId && member.roomId === room.roomId
      ? {
          ...member,
          lastActiveAt: new Date().toISOString(),
          location: applyPrivacyModeToLocation(location, room.privacyMode),
        }
      : member,
  );
  const roomMembers = nextMembers.filter((member) => member.roomId === room.roomId);
  const midpoint = computePersistedMidpoint(roomMembers);
  const nextRooms = store.rooms.map((candidate) =>
    candidate.roomId === room.roomId
      ? {
          ...candidate,
          midpoint,
        }
      : candidate,
  );
  const nextRoom = nextRooms.find((candidate) => candidate.roomId === room.roomId);

  if (!nextRoom) {
    throw new Error("Room update failed.");
  }

  const nextStore = {
    ...store,
    rooms: nextRooms,
    members: nextMembers,
  };

  await writeStore(nextStore);

  return {
    snapshot: buildSnapshot(nextStore, nextRoom),
  };
}
