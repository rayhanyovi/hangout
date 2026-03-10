"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Coordinate } from "@/lib/contracts";

const DEFAULT_CENTER: Coordinate = {
  lat: -6.2,
  lng: 106.8,
};

const pickedLocationIcon = new L.DivIcon({
  html: `<div style="background:#1d7c73;width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;border:3px solid white;box-shadow:0 10px 24px rgba(31,27,23,0.18);">P</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

function FocusSelectedCoordinate({
  selectedCoordinate,
}: {
  selectedCoordinate: Coordinate | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCoordinate) {
      return;
    }

    map.flyTo([selectedCoordinate.lat, selectedCoordinate.lng], 15, {
      duration: 0.4,
    });
  }, [map, selectedCoordinate]);

  return null;
}

function LocationPickerEvents({
  onPick,
}: {
  onPick: (coordinate: Coordinate) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

type LocationPickerMapClientProps = {
  initialCenter?: Coordinate | null;
  selectedCoordinate?: Coordinate | null;
  testId?: string;
  onPick: (coordinate: Coordinate) => void;
};

export function LocationPickerMapClient({
  initialCenter = null,
  selectedCoordinate = null,
  testId,
  onPick,
}: LocationPickerMapClientProps) {
  const center = selectedCoordinate ?? initialCenter ?? DEFAULT_CENTER;

  return (
    <div className="space-y-3">
      <div className="pointer-events-none rounded-[1rem] border border-line bg-white/78 px-3 py-2 text-xs leading-6 text-muted">
        Click the map to drop a pin. Coordinate fields below will update
        automatically before you save the location.
      </div>

      <div
        className="overflow-hidden rounded-[1.25rem] border border-line shadow-[0_16px_36px_rgba(31,27,23,0.12)]"
        data-testid={testId}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          className="h-[240px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationPickerEvents onPick={onPick} />
          <FocusSelectedCoordinate selectedCoordinate={selectedCoordinate} />

          {selectedCoordinate ? (
            <Marker
              icon={pickedLocationIcon}
              position={[selectedCoordinate.lat, selectedCoordinate.lng]}
            />
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
