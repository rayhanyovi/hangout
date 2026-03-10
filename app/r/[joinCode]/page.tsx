import { RoomMap } from "@/components/maps/room-map";
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
    >
      <div className="mt-8">
        <RoomMap
          members={[
            { id: "tara", name: "Tara", lat: -6.2088, lng: 106.8456 },
            { id: "raka", name: "Raka", lat: -6.1894, lng: 106.8229 },
          ]}
          midpoint={{ lat: -6.1994, lng: 106.8342 }}
          radiusM={2000}
          venues={[
            { id: "kopi-tengah", name: "Kopi Tengah", lat: -6.1982, lng: 106.8331 },
          ]}
        />
      </div>
    </RouteShell>
  );
}
