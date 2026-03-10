import { LoadingShell } from "@/components/routes/loading-shell";

export default function RoomLoading() {
  return (
    <LoadingShell
      badge="Route: /r/[joinCode]"
      title="Menyinkronkan room."
      description="Snapshot room, roster member, dan shortlist venue sedang disiapkan."
    />
  );
}
