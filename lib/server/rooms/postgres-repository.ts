import "server-only";

import crypto from "node:crypto";
import type { PoolClient } from "pg";
import {
  applyPrivacyModeToLocation,
  getRoomDecisionRoute,
  getRoomRoute,
  transitionRoomState,
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
  type UpdateMemberLocationOutput,
  type Venue,
  type Vote,
} from "@/lib/contracts";
import { LOCATION_RETENTION_POLICY } from "@/lib/contracts/privacy";
import { buildMidpointFairnessSummary } from "@/lib/rooms";
import { getPostgresPool } from "@/lib/server/db/client";
import { trackAnalyticsEvent } from "@/lib/server/observability/logger";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_UNIQUE_CONSTRAINT = "rooms_join_code_key";

type RoomRow = {
  room_id: string;
  join_code: string;
  title: string | null;
  created_at: string;
  expires_at: string;
  created_by_member_id: string;
  transport_mode: Room["transportMode"];
  privacy_mode: Room["privacyMode"];
  venue_preferences: Room["venuePreferences"];
  midpoint: Midpoint | null;
  finalized_decision: Room["finalizedDecision"] | null;
  status: Room["status"];
};

type MemberRow = {
  member_id: string;
  room_id: string;
  display_name: string;
  role: Member["role"];
  joined_at: string;
  last_active_at: string;
  location: MemberLocation | null;
};

type VoteRow = {
  vote_id: string;
  room_id: string;
  member_id: string;
  venue_id: string;
  reaction: string | null;
  comment: string | null;
  updated_at: string;
};

type VenueCacheRow = {
  room_id: string;
  venues: Venue[];
  updated_at: string;
};

function randomJoinCode() {
  return Array.from({ length: 6 }, () => {
    const index = crypto.randomInt(0, JOIN_CODE_ALPHABET.length);
    return JOIN_CODE_ALPHABET[index];
  }).join("");
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

function serializeJson(value: unknown) {
  return value === null ? null : JSON.stringify(value);
}

function isPgError(error: unknown): error is Error & { code?: string; constraint?: string } {
  return error instanceof Error;
}

function mapRoom(row: RoomRow): Room {
  return {
    roomId: row.room_id,
    joinCode: row.join_code,
    title: row.title,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    createdByMemberId: row.created_by_member_id,
    transportMode: row.transport_mode,
    privacyMode: row.privacy_mode,
    venuePreferences: row.venue_preferences,
    midpoint: row.midpoint,
    finalizedDecision: row.finalized_decision,
    status: row.status,
  };
}

function mapMember(row: MemberRow): Member {
  return {
    memberId: row.member_id,
    roomId: row.room_id,
    displayName: row.display_name,
    role: row.role,
    joinedAt: row.joined_at,
    lastActiveAt: row.last_active_at,
    location: row.location,
  };
}

function mapVote(row: VoteRow): Vote {
  return {
    voteId: row.vote_id,
    roomId: row.room_id,
    memberId: row.member_id,
    venueId: row.venue_id,
    reaction: row.reaction ?? undefined,
    comment: row.comment ?? undefined,
    updatedAt: row.updated_at,
  };
}

async function pruneExpiredRooms(client: PoolClient) {
  await client.query("delete from rooms where expires_at <= now()");
}

async function fetchRoomRowByJoinCode(client: PoolClient, joinCode: string) {
  const result = await client.query<RoomRow>(
    `
      select
        room_id,
        join_code,
        title,
        created_at,
        expires_at,
        created_by_member_id,
        transport_mode,
        privacy_mode,
        venue_preferences,
        midpoint,
        finalized_decision,
        status
      from rooms
      where join_code = $1
      limit 1
    `,
    [joinCode],
  );

  return result.rows[0] ?? null;
}

async function fetchMembersByRoomId(client: PoolClient, roomId: string) {
  const result = await client.query<MemberRow>(
    `
      select
        member_id,
        room_id,
        display_name,
        role,
        joined_at,
        last_active_at,
        location
      from members
      where room_id = $1
      order by joined_at asc
    `,
    [roomId],
  );

  return result.rows.map(mapMember);
}

async function fetchVotesByRoomId(client: PoolClient, roomId: string) {
  const result = await client.query<VoteRow>(
    `
      select
        vote_id,
        room_id,
        member_id,
        venue_id,
        reaction,
        comment,
        updated_at
      from votes
      where room_id = $1
      order by updated_at desc
    `,
    [roomId],
  );

  return result.rows.map(mapVote);
}

async function fetchCachedVenuesByRoomId(client: PoolClient, roomId: string) {
  const result = await client.query<VenueCacheRow>(
    `
      select room_id, venues, updated_at
      from venue_cache
      where room_id = $1
      limit 1
    `,
    [roomId],
  );

  return result.rows[0]?.venues ?? [];
}

async function buildSnapshotForRoom(client: PoolClient, room: Room): Promise<RoomSnapshot> {
  const members = await fetchMembersByRoomId(client, room.roomId);
  const votes = await fetchVotesByRoomId(client, room.roomId);
  const venues = await fetchCachedVenuesByRoomId(client, room.roomId);

  return {
    room,
    members,
    votes,
    venues,
  };
}

async function insertRoom(client: PoolClient, room: Room) {
  await client.query(
    `
      insert into rooms (
        room_id,
        join_code,
        title,
        created_at,
        expires_at,
        created_by_member_id,
        transport_mode,
        privacy_mode,
        venue_preferences,
        midpoint,
        finalized_decision,
        status
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12
      )
    `,
    [
      room.roomId,
      room.joinCode,
      room.title,
      room.createdAt,
      room.expiresAt,
      room.createdByMemberId,
      room.transportMode,
      room.privacyMode,
      serializeJson(room.venuePreferences),
      serializeJson(room.midpoint),
      serializeJson(room.finalizedDecision),
      room.status,
    ],
  );
}

async function insertMember(client: PoolClient, member: Member) {
  await client.query(
    `
      insert into members (
        member_id,
        room_id,
        display_name,
        role,
        joined_at,
        last_active_at,
        location
      ) values (
        $1, $2, $3, $4, $5, $6, $7::jsonb
      )
    `,
    [
      member.memberId,
      member.roomId,
      member.displayName,
      member.role,
      member.joinedAt,
      member.lastActiveAt,
      serializeJson(member.location),
    ],
  );
}

export async function createRoom(
  input: CreateRoomInput,
  origin: string,
): Promise<CreateRoomOutput> {
  const pool = getPostgresPool();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const client = await pool.connect();

    try {
      await client.query("begin");
      await pruneExpiredRooms(client);

      const hostMember = createMemberRecord("pending-room", input.hostDisplayName, "host");
      const room = createRoomRecord(input, randomJoinCode(), hostMember.memberId);
      const persistedHostMember = {
        ...hostMember,
        roomId: room.roomId,
      };

      await insertRoom(client, room);
      await insertMember(client, persistedHostMember);
      await client.query("commit");

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
    } catch (error) {
      await client.query("rollback");

      if (
        isPgError(error) &&
        error.code === "23505" &&
        error.constraint === JOIN_CODE_UNIQUE_CONSTRAINT &&
        attempt < 9
      ) {
        continue;
      }

      throw error;
    } finally {
      client.release();
    }
  }

  throw new Error("Failed to generate a unique join code.");
}

export async function joinRoom(input: JoinRoomInput): Promise<JoinRoomOutput> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await pruneExpiredRooms(client);

    const roomRow = await fetchRoomRowByJoinCode(client, input.joinCode);

    if (!roomRow) {
      throw new Error("Room not found.");
    }

    const room = mapRoom(roomRow);

    if (room.status !== "open") {
      throw new Error("Room is not open for new members.");
    }

    const member = createMemberRecord(room.roomId, input.displayName, "member");
    await insertMember(client, member);
    const snapshot = await buildSnapshotForRoom(client, room);
    await client.query("commit");

    trackAnalyticsEvent("room_joined", {
      roomId: room.roomId,
      joinCode: room.joinCode,
      memberId: member.memberId,
      role: member.role,
      memberCount: snapshot.members.length,
    });

    return {
      room,
      member,
      snapshot,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getRoomSnapshot(
  joinCode: string,
): Promise<GetRoomSnapshotOutput | null> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await pruneExpiredRooms(client);
    const roomRow = await fetchRoomRowByJoinCode(client, joinCode);

    if (!roomRow) {
      return null;
    }

    const room = mapRoom(roomRow);

    return buildSnapshotForRoom(client, room);
  } finally {
    client.release();
  }
}

export async function updateMemberLocation(
  joinCode: string,
  memberId: string,
  location: MemberLocation,
): Promise<UpdateMemberLocationOutput> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await pruneExpiredRooms(client);

    const roomRow = await fetchRoomRowByJoinCode(client, joinCode);

    if (!roomRow) {
      throw new Error("Room not found.");
    }

    const room = mapRoom(roomRow);
    const nextLocation = applyPrivacyModeToLocation(location, room.privacyMode);
    const updateResult = await client.query<{ member_id: string }>(
      `
        update members
        set
          last_active_at = $3,
          location = $4::jsonb
        where member_id = $1 and room_id = $2
        returning member_id
      `,
      [memberId, room.roomId, new Date().toISOString(), serializeJson(nextLocation)],
    );

    if (updateResult.rowCount === 0) {
      throw new Error("Member not found.");
    }

    const roomMembers = await fetchMembersByRoomId(client, room.roomId);
    const midpoint = computePersistedMidpoint(roomMembers);
    const nextRoomResult = await client.query<RoomRow>(
      `
        update rooms
        set midpoint = $2::jsonb
        where room_id = $1
        returning
          room_id,
          join_code,
          title,
          created_at,
          expires_at,
          created_by_member_id,
          transport_mode,
          privacy_mode,
          venue_preferences,
          midpoint,
          finalized_decision,
          status
      `,
      [room.roomId, serializeJson(midpoint)],
    );

    const nextRoomRow = nextRoomResult.rows[0];

    if (!nextRoomRow) {
      throw new Error("Room update failed.");
    }

    const nextRoom = mapRoom(nextRoomRow);
    const snapshot = await buildSnapshotForRoom(client, nextRoom);
    await client.query("commit");

    trackAnalyticsEvent("member_location_updated", {
      roomId: room.roomId,
      joinCode: room.joinCode,
      memberId,
      privacyMode: room.privacyMode,
      locatedMemberCount: roomMembers.filter((member) => member.location !== null).length,
      midpointReady: midpoint !== null,
    });

    return {
      snapshot,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function setRoomVenueCache(joinCode: string, venues: Venue[]) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await pruneExpiredRooms(client);

    const roomRow = await fetchRoomRowByJoinCode(client, joinCode);

    if (!roomRow) {
      throw new Error("Room not found.");
    }

    await client.query(
      `
        insert into venue_cache (room_id, venues, updated_at)
        values ($1, $2::jsonb, $3)
        on conflict (room_id)
        do update set
          venues = excluded.venues,
          updated_at = excluded.updated_at
      `,
      [roomRow.room_id, serializeJson(venues), new Date().toISOString()],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function castVote(
  joinCode: string,
  memberId: string,
  venueId: string,
  reaction?: string,
  comment?: string,
): Promise<CastVoteOutput> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await pruneExpiredRooms(client);

    const roomRow = await fetchRoomRowByJoinCode(client, joinCode);

    if (!roomRow) {
      throw new Error("Room not found.");
    }

    const room = mapRoom(roomRow);

    if (room.status !== "open") {
      throw new Error("Room is not open for voting.");
    }

    const memberResult = await client.query<{ member_id: string }>(
      `
        select member_id
        from members
        where member_id = $1 and room_id = $2
        limit 1
      `,
      [memberId, room.roomId],
    );

    if (memberResult.rowCount === 0) {
      throw new Error("Member not found.");
    }

    const cachedVenues = await fetchCachedVenuesByRoomId(client, room.roomId);
    const venueExists = cachedVenues.some((venue) => venue.venueId === venueId);

    if (!venueExists) {
      throw new Error("Venue is not available in the current room shortlist.");
    }

    const existingVoteResult = await client.query<VoteRow>(
      `
        select
          vote_id,
          room_id,
          member_id,
          venue_id,
          reaction,
          comment,
          updated_at
        from votes
        where room_id = $1 and member_id = $2
        limit 1
      `,
      [room.roomId, memberId],
    );

    const nowIso = new Date().toISOString();
    const existingVote = existingVoteResult.rows[0];
    const vote: Vote = existingVote
      ? {
          voteId: existingVote.vote_id,
          roomId: room.roomId,
          memberId,
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

    if (existingVote) {
      await client.query(
        `
          update votes
          set venue_id = $3, reaction = $4, comment = $5, updated_at = $6
          where vote_id = $1 and room_id = $2
        `,
        [vote.voteId, room.roomId, venueId, reaction ?? null, comment ?? null, nowIso],
      );
    } else {
      await client.query(
        `
          insert into votes (
            vote_id,
            room_id,
            member_id,
            venue_id,
            reaction,
            comment,
            updated_at
          ) values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          vote.voteId,
          room.roomId,
          memberId,
          venueId,
          reaction ?? null,
          comment ?? null,
          nowIso,
        ],
      );
    }

    const snapshot = await buildSnapshotForRoom(client, room);
    await client.query("commit");

    trackAnalyticsEvent("vote_cast", {
      roomId: room.roomId,
      joinCode: room.joinCode,
      memberId,
      venueId,
      totalVotes: snapshot.votes.length,
    });

    return {
      vote,
      snapshot,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function finalizeRoom(
  joinCode: string,
  memberId: string,
  venueId: string,
  origin: string,
): Promise<FinalizeRoomOutput> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await pruneExpiredRooms(client);

    const roomRow = await fetchRoomRowByJoinCode(client, joinCode);

    if (!roomRow) {
      throw new Error("Room not found.");
    }

    const room = mapRoom(roomRow);

    if (room.createdByMemberId !== memberId) {
      throw new Error("Only the host can finalize the room.");
    }

    const cachedVenues = await fetchCachedVenuesByRoomId(client, room.roomId);
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

    const nextRoomResult = await client.query<RoomRow>(
      `
        update rooms
        set status = $2, finalized_decision = $3::jsonb
        where room_id = $1
        returning
          room_id,
          join_code,
          title,
          created_at,
          expires_at,
          created_by_member_id,
          transport_mode,
          privacy_mode,
          venue_preferences,
          midpoint,
          finalized_decision,
          status
      `,
      [room.roomId, transition.status, serializeJson(decision)],
    );

    const nextRoomRow = nextRoomResult.rows[0];

    if (!nextRoomRow) {
      throw new Error("Room finalization failed.");
    }

    const nextRoom = mapRoom(nextRoomRow);
    const snapshot = await buildSnapshotForRoom(client, nextRoom);
    await client.query("commit");

    trackAnalyticsEvent("room_finalized", {
      roomId: room.roomId,
      joinCode: room.joinCode,
      finalizedByMemberId: memberId,
      venueId,
    });

    return {
      decision,
      snapshot,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
