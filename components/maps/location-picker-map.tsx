"use client";

import dynamic from "next/dynamic";
import type { Coordinate } from "@/lib/contracts";

type LocationPickerMapProps = {
  initialCenter?: Coordinate | null;
  selectedCoordinate?: Coordinate | null;
  testId?: string;
  onPick: (coordinate: Coordinate) => void;
};

const ClientLocationPickerMap = dynamic(
  () =>
    import("@/components/maps/location-picker-map.client").then(
      (module) => module.LocationPickerMapClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] items-center justify-center rounded-[1.25rem] border border-line bg-surface text-sm text-muted">
        Loading pin picker...
      </div>
    ),
  },
);

export function LocationPickerMap(props: LocationPickerMapProps) {
  return <ClientLocationPickerMap {...props} />;
}
