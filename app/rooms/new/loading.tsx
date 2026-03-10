import { LoadingShell } from "@/components/routes/loading-shell";

export default function NewRoomLoading() {
  return (
    <LoadingShell
      badge="Route: /rooms/new"
      title="Menyiapkan host setup."
      description="Shell form room lagi dihydrate supaya create room flow siap dipakai."
    />
  );
}
