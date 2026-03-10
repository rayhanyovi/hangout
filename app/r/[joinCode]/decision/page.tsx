import { RouteShell } from "@/components/routes/route-shell";

type RoomDecisionPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

export default async function RoomDecisionPage({
  params,
}: RoomDecisionPageProps) {
  const { joinCode } = await params;

  return (
    <RouteShell
      badge={`Route: /r/${joinCode}/decision`}
      title="Final decision summary punya route sendiri."
      description="Route ini dibekukan untuk menampilkan venue yang sudah dikunci, fairness summary final, dan handoff ke Google Maps tanpa membawa seluruh UI room aktif."
      nextStep="Bangun summary view yang hanya membaca finalized room state dan menampilkan output shareable yang stabil."
    />
  );
}
