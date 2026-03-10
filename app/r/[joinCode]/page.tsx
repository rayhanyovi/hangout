import { RouteShell } from "@/components/routes/route-shell";

type RoomPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { joinCode } = await params;

  return (
    <RouteShell
      badge={`Route: /r/${joinCode}`}
      title="Ini route room utama untuk seluruh flow kolaborasi."
      description="Join, share location, midpoint, venue shortlist, voting, dan finalisasi akan hidup di route ini supaya satu link room tetap jadi pusat koordinasi grup."
      nextStep="Bangun room shell yang membaca join code, hydrate room state, lalu pasang blok anggota, lokasi, peta, venue, dan voting."
    />
  );
}
