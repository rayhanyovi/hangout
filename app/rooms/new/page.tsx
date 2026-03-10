import { RouteShell } from "@/components/routes/route-shell";

export default function NewRoomPage() {
  return (
    <RouteShell
      badge="Route: /rooms/new"
      title="Host setup dimulai dari sini."
      description="Route ini dibekukan sebagai entry point untuk host membuat room baru, memilih transport mode, privacy mode, dan preferensi venue dasar sebelum link dibagikan."
      nextStep="Bangun form create-room yang menghasilkan join code dan me-redirect host ke room route utama."
    />
  );
}
