import { notFound } from "next/navigation";
import { RoomPageShell } from "@/components/rooms/room-page-shell";
import {
  buildDraftRoomSeedFromSnapshot,
  mapSnapshotMembersToDraftMembers,
  parseDraftRoomSearchParams,
} from "@/lib/rooms";
import { getRoomSnapshot } from "@/lib/server/rooms/repository";

type RoomPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RoomPage({
  params,
  searchParams,
}: RoomPageProps) {
  const { joinCode } = await params;
  const resolvedSearchParams = await searchParams;
  const draftSeed = parseDraftRoomSearchParams(resolvedSearchParams);

  if (draftSeed.previewMode) {
    return <RoomPageShell joinCode={joinCode.toUpperCase()} draftSeed={draftSeed} />;
  }

  const snapshot = await getRoomSnapshot(joinCode.toUpperCase());

  if (!snapshot) {
    notFound();
  }

  const currentMemberId = getFirstValue(resolvedSearchParams.member);

  return (
    <RoomPageShell
      joinCode={joinCode.toUpperCase()}
      draftSeed={buildDraftRoomSeedFromSnapshot(snapshot)}
      initialMembers={mapSnapshotMembersToDraftMembers(snapshot)}
      liveRoomContext={{
        currentMemberId: currentMemberId ?? null,
        initialVotes: snapshot.votes,
        finalizedVenueId: snapshot.room.finalizedDecision?.venueId ?? null,
      }}
    />
  );
}
