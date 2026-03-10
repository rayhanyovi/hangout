"use client";

import dynamic from "next/dynamic";
import type { Coordinate } from "@/lib/contracts";

export type RoomMapVenue = Coordinate & {
  id: string;
  name: string;
};

export type RoomMapMember = Coordinate & {
  id: string;
  name: string;
};

type RoomMapProps = {
  members: RoomMapMember[];
  venues?: RoomMapVenue[];
  midpoint?: Coordinate | null;
  radiusM?: number;
};

const LeafletRoomMapClient = dynamic(
  () =>
    import("@/components/maps/room-map.client").then(
      (module) => module.RoomMapClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-[1.5rem] border border-line bg-surface text-sm text-muted">
        Loading map shell...
      </div>
    ),
  },
);

export function RoomMap(props: RoomMapProps) {
  return <LeafletRoomMapClient {...props} />;
}
