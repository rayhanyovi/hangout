import { LoadingShell } from "@/components/routes/loading-shell";

export default function RoomDecisionLoading() {
  return (
    <LoadingShell
      badge="Route: /r/[joinCode]/decision"
      title="Menyiapkan decision summary."
      description="Final venue, vote recap, dan handoff Maps sedang dibaca dari room state."
    />
  );
}
