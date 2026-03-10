import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  applyPrivacyModeToLocation,
  getRoomDecisionRoute,
  getRoomRoute,
  transitionRoomState,
  type AddRoomMemberOutput,
  type CastVoteOutput,
  type CreateRoomInput,
  type CreateRoomOutput,
  type FinalizeRoomOutput,
  type GetRoomSnapshotOutput,
  type JoinRoomInput,
  type JoinRoomOutput,
  type Member,
  type MemberLocation,
  type Midpoint,
  type Room,
  type RoomSnapshot,
  type UpdateRoomDetailsOutput,
  type UpdateMemberLocationOutput,
  type Venue,
  type Vote,
} from "@/lib/contracts";
import { buildMidpointFairnessSummary } from "@/lib/rooms";
import { LOCATION_RETENTION_POLICY } from "@/lib/contracts/privacy";
import { serverEnv } from "@/lib/server/config/env";
import {
  logOperationalEvent,
  trackAnalyticsEvent,
} from "@/lib/server/observability/logger";

type RoomStoreFile = {
  rooms: Room[];
  members: Member[];
  votes: Vote[];
  venuesCache: Array<{
    roomId: string;
    venues: Venue[];
    updatedAt: string;
  }>;
};

const ROOM_STORE_DIRECTORY =
  serverEnv.HANGOUT_ROOM_STORE_DIR ?? path.join(tmpdir(), "hangout");
const ROOM_STORE_FILE = path.join(ROOM_STORE_DIRECTORY, "room-store.json");
const EMPTY_ROOM_STORE: RoomStoreFile = {
  rooms: [],
  members: [],
  votes: [],
  venuesCache: [],
};
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type PrunedRoomStore = {
  prunedRoomCount: number;
  store: RoomStoreFile;
};

async function ensureStoreFile() {
  await mkdir(ROOM_STORE_DIRECTORY, { recursive: true });

  try {
    await readFile(ROOM_STORE_FILE, "utf8");
  } catch {
    await writeFile(ROOM_STORE_FILE, JSON.stringify(EMPTY_ROOM_STORE, null, 2), "utf8");
  }
}

async function readRawStore() {
  await ensureStoreFile();

  const contents = await readFile(ROOM_STORE_FILE, "utf8");
  const parsed = JSON.parse(contents) as Partial<RoomStoreFile>;

  return {
    rooms: parsed.rooms ?? [],
    members: parsed.members ?? [],
    votes: parsed.votes ?? [],
    venuesCache: parsed.venuesCache ?? [],
  };
}

async function readStore() {
  const rawStore = await readRawStore();

  return pruneExpiredRooms(rawStore).store;
}

async function writeStore(store: RoomStoreFile) {
  await ensureStoreFile();
  await writeFile(ROOM_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function pruneExpiredRooms(store: RoomStoreFile): PrunedRoomStore {
  const now = Date.now();
  const activeRooms = store.rooms.filter(
    (room) => new Date(room.expiresAt).getTime() > now,
  );
  const activeRoomIds = new Set(activeRooms.map((room) => room.roomId));

  return {
    prunedRoomCount: store.rooms.length - activeRooms.length,
    store: {
      rooms: activeRooms,
      members: store.members.filter((member) => activeRoomIds.has(member.roomId)),
      votes: store.votes.filter((vote) => activeRoomIds.has(vote.roomId)),
      venuesCache: store.venuesCache.filter((cache) => activeRoomIds.has(cache.roomId)),
    },
  };
}

function buildSnapshot(store: RoomStoreFile, room: Room): RoomSnapshot {
  return {
    room,
    members: store.members.filter((member) => member.roomId === room.roomId),
    venues:
      store.venuesCache.find((cache) => cache.roomId === room.roomId)?.venues ?? [],
    votes: store.votes.filter((vote) => vote.roomId === room.roomId),
  };
}

function computePersistedMidpoint(
  members: Member[],
  transportMode: Room["transportMode"],
): Midpoint | null {
  const locatedMembers = members
    .filter((member): member is Member & { location: MemberLocation } => member.location !== null)
    .map((member) => ({
      id: member.memberId,
      name: member.displayName,
      lat: member.location.lat,
      lng: member.location.lng,
    }));

  const fairnessSummary = buildMidpointFairnessSummary(
    locatedMembers,
    transportMode,
  );

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
    description: input.description ?? null,
    scheduledLabel: input.scheduledLabel ?? null,
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
  trackAnalyticsEvent("room_created", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    hostMemberId: persistedHostMember.memberId,
    privacyMode: room.privacyMode,
    transportMode: room.transportMode,
    venueCategoryCount: room.venuePreferences.categories.length,
  });

  return {
    room,
    hostMember: persistedHostMember,
    shareUrl: `${origin}${getRoomRoute(room.joinCode)}`,
  };
}

export async function cleanupExpiredRooms() {
  const rawStore = await readRawStore();
  const { prunedRoomCount, store } = pruneExpiredRooms(rawStore);

  if (prunedRoomCount > 0) {
    await writeStore(store);
  }

  logOperationalEvent(
    "room_cleanup_completed",
    {
      prunedRoomCount,
      storageBackend: "file",
    },
    "info",
  );

  return {
    prunedRoomCount,
    storageBackend: "file" as const,
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
  trackAnalyticsEvent("room_joined", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    memberId: member.memberId,
    role: member.role,
    memberCount: nextStore.members.filter((candidate) => candidate.roomId === room.roomId).length,
  });

  return {
    room,
    member,
    snapshot: buildSnapshot(nextStore, room),
  };
}

export async function addRoomMember(
  joinCode: string,
  actorMemberId: string,
  displayName: string,
): Promise<AddRoomMemberOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== "open") {
    throw new Error("Room is not open for new members.");
  }

  if (room.createdByMemberId !== actorMemberId) {
    throw new Error("Only the host can add members manually.");
  }

  const member = createMemberRecord(room.roomId, displayName, "member");
  const nextStore = {
    ...store,
    members: [...store.members, member],
  };

  await writeStore(nextStore);
  trackAnalyticsEvent("room_member_added_manually", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    actorMemberId,
    memberId: member.memberId,
  });

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
  actorMemberId: string,
  memberId: string,
  location: MemberLocation,
): Promise<UpdateMemberLocationOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  const actor = store.members.find(
    (member) => member.memberId === actorMemberId && member.roomId === room.roomId,
  );

  if (!actor) {
    throw new Error("Actor member not found.");
  }

  const targetMember = store.members.find(
    (member) => member.memberId === memberId && member.roomId === room.roomId,
  );

  if (!targetMember) {
    throw new Error("Member not found.");
  }

  const canManageLocation =
    actor.memberId === targetMember.memberId || actor.role === "host";

  if (!canManageLocation) {
    throw new Error("Only the host can update other members' locations.");
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
  const midpoint = computePersistedMidpoint(roomMembers, room.transportMode);
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
  trackAnalyticsEvent("member_location_updated", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    memberId,
    privacyMode: room.privacyMode,
    locatedMemberCount: roomMembers.filter((member) => member.location !== null).length,
    midpointReady: midpoint !== null,
  });

  return {
    snapshot: buildSnapshot(nextStore, nextRoom),
  };
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
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.createdByMemberId !== actorMemberId) {
    throw new Error("Only the host can update room details.");
  }

  const nextRooms = store.rooms.map((candidate) =>
    candidate.roomId === room.roomId
      ? {
          ...candidate,
          title:
            details.title !== undefined ? details.title : candidate.title,
          description:
            details.description !== undefined
              ? details.description
              : candidate.description,
          scheduledLabel:
            details.scheduledLabel !== undefined
              ? details.scheduledLabel
              : candidate.scheduledLabel,
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
  };

  await writeStore(nextStore);

  return {
    snapshot: buildSnapshot(nextStore, nextRoom),
  };
}

export async function setRoomVenueCache(
  joinCode: string,
  venues: Venue[],
) {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  const nextCacheEntry = {
    roomId: room.roomId,
    venues,
    updatedAt: new Date().toISOString(),
  };
  const existingCacheIndex = store.venuesCache.findIndex(
    (cache) => cache.roomId === room.roomId,
  );
  const nextVenueCache = [...store.venuesCache];

  if (existingCacheIndex >= 0) {
    nextVenueCache[existingCacheIndex] = nextCacheEntry;
  } else {
    nextVenueCache.push(nextCacheEntry);
  }

  await writeStore({
    ...store,
    venuesCache: nextVenueCache,
  });
}

export async function castVote(
  joinCode: string,
  memberId: string,
  venueId: string,
  reaction?: string,
  comment?: string,
): Promise<CastVoteOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== "open") {
    throw new Error("Room is not open for voting.");
  }

  const member = store.members.find(
    (candidate) => candidate.memberId === memberId && candidate.roomId === room.roomId,
  );

  if (!member) {
    throw new Error("Member not found.");
  }

  const cachedVenues =
    store.venuesCache.find((cache) => cache.roomId === room.roomId)?.venues ?? [];
  const venueExists = cachedVenues.some((venue) => venue.venueId === venueId);

  if (!venueExists) {
    throw new Error("Venue is not available in the current room shortlist.");
  }

  const existingVote = store.votes.find(
    (vote) => vote.roomId === room.roomId && vote.memberId === memberId,
  );
  const nowIso = new Date().toISOString();
  const vote: Vote = existingVote
    ? {
        ...existingVote,
        venueId,
        reaction,
        comment,
        updatedAt: nowIso,
      }
    : {
        voteId: crypto.randomUUID(),
        roomId: room.roomId,
        memberId,
        venueId,
        reaction,
        comment,
        updatedAt: nowIso,
      };

  const nextVotes = existingVote
    ? store.votes.map((candidate) =>
        candidate.voteId === existingVote.voteId ? vote : candidate,
      )
    : [...store.votes, vote];
  const nextStore = {
    ...store,
    votes: nextVotes,
  };

  await writeStore(nextStore);
  trackAnalyticsEvent("vote_cast", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    memberId,
    venueId,
    totalVotes: nextVotes.filter((candidate) => candidate.roomId === room.roomId).length,
  });

  return {
    vote,
    snapshot: buildSnapshot(nextStore, room),
  };
}

export async function finalizeRoom(
  joinCode: string,
  memberId: string,
  venueId: string,
  origin: string,
): Promise<FinalizeRoomOutput> {
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.joinCode === joinCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.createdByMemberId !== memberId) {
    throw new Error("Only the host can finalize the room.");
  }

  const cachedVenues =
    store.venuesCache.find((cache) => cache.roomId === room.roomId)?.venues ?? [];
  const venueExists = cachedVenues.some((venue) => venue.venueId === venueId);

  if (!venueExists) {
    throw new Error("Venue is not available in the current room shortlist.");
  }

  const transition = transitionRoomState(room.status, "venue_finalized", {
    actorMemberId: memberId,
    venueId,
    nowIso: new Date().toISOString(),
  });
  const decision = {
    roomId: room.roomId,
    venueId,
    finalizedByMemberId: memberId,
    finalizedAt: transition.finalizedAt ?? new Date().toISOString(),
    shareUrl: `${origin}${getRoomDecisionRoute(joinCode)}`,
  };
  const nextRooms = store.rooms.map((candidate) =>
    candidate.roomId === room.roomId
      ? {
          ...candidate,
          status: transition.status,
          finalizedDecision: decision,
        }
      : candidate,
  );
  const nextRoom = nextRooms.find((candidate) => candidate.roomId === room.roomId);

  if (!nextRoom) {
    throw new Error("Room finalization failed.");
  }

  const nextStore = {
    ...store,
    rooms: nextRooms,
  };

  await writeStore(nextStore);
  trackAnalyticsEvent("room_finalized", {
    roomId: room.roomId,
    joinCode: room.joinCode,
    finalizedByMemberId: memberId,
    venueId,
  });

  return {
    decision,
    snapshot: buildSnapshot(nextStore, nextRoom),
  };
}
