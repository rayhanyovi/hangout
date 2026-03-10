import { RoomPageShell } from "@/components/rooms/room-page-shell";
import { parseDraftRoomSearchParams } from "@/lib/rooms";

type RoomPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RoomPage({
  params,
  searchParams,
}: RoomPageProps) {
  const { joinCode } = await params;
  const draftSeed = parseDraftRoomSearchParams(await searchParams);

  return <RoomPageShell joinCode={joinCode.toUpperCase()} draftSeed={draftSeed} />;
}
