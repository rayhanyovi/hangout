"use client";

import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Coordinate } from "@/lib/contracts";
import type {
  RoomMapMember,
  RoomMapVenue,
} from "@/components/maps/room-map";

const memberIcon = new L.DivIcon({
  html: `<div style="background:var(--primary);width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:var(--primary-foreground);font-weight:700;font-size:12px;border:3px solid var(--card);box-shadow:var(--shadow-lg);">M</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

const midpointIcon = new L.DivIcon({
  html: `<div style="background:var(--success);width:38px;height:38px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:var(--primary-foreground);font-weight:700;font-size:14px;border:3px solid var(--card);box-shadow:var(--shadow-lg);">+</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "",
});

const venueIcon = new L.DivIcon({
  html: `<div style="background:var(--accent);width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:var(--accent-foreground);font-weight:700;font-size:11px;border:3px solid var(--card);box-shadow:var(--shadow-lg);">V</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: "",
});

const selectedVenueIcon = new L.DivIcon({
  html: `<div style="background:var(--foreground);width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:var(--background);font-weight:700;font-size:11px;border:3px solid var(--card);box-shadow:var(--shadow-xl);">V</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: "",
});

function FitToData({
  members,
  midpoint,
  venues,
}: {
  members: RoomMapMember[];
  midpoint?: Coordinate | null;
  venues: RoomMapVenue[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...members.map((member) => [member.lat, member.lng] as [number, number]),
      ...venues.map((venue) => [venue.lat, venue.lng] as [number, number]),
    ];

    if (midpoint) {
      points.push([midpoint.lat, midpoint.lng]);
    }

    if (points.length === 0) {
      map.setView([-6.2, 106.8], 12);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [map, members, midpoint, venues]);

  return null;
}

function FocusSelectedVenue({
  selectedVenue,
}: {
  selectedVenue: RoomMapVenue | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedVenue) {
      return;
    }

    map.flyTo([selectedVenue.lat, selectedVenue.lng], Math.max(map.getZoom(), 15), {
      duration: 0.6,
    });
  }, [map, selectedVenue]);

  return null;
}

type RoomMapClientProps = {
  members: RoomMapMember[];
  venues?: RoomMapVenue[];
  midpoint?: Coordinate | null;
  radiusM?: number;
  selectedVenueId?: string | null;
};

export function RoomMapClient({
  members,
  venues = [],
  midpoint = null,
  radiusM,
  selectedVenueId = null,
}: RoomMapClientProps) {
  const selectedVenue =
    venues.find((venue) => venue.id === selectedVenueId) ?? null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line shadow-xl">
      <div className="pointer-events-none absolute left-4 top-4 z-[500] flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
        <div className="rounded-full border border-line bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-md">
          {members.length} members
        </div>
        <div className="rounded-full border border-line bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-md">
          {venues.length} venues
        </div>
        {radiusM ? (
          <div className="rounded-full border border-line bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-md">
            radius {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`}
          </div>
        ) : null}
        {selectedVenue ? (
          <div className="rounded-full border border-line bg-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-md">
            focus {selectedVenue.name}
          </div>
        ) : null}
      </div>

      <MapContainer
        center={[-6.2, 106.8]}
        zoom={12}
        className="h-[380px] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToData members={members} midpoint={midpoint} venues={venues} />
        <FocusSelectedVenue selectedVenue={selectedVenue} />

        {midpoint && radiusM ? (
          <Circle
            center={[midpoint.lat, midpoint.lng]}
            radius={radiusM}
            pathOptions={{
              color: "var(--success)",
              fillColor: "var(--success)",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 4",
            }}
          />
        ) : null}

        {members.map((member) => (
          <Marker
            key={member.id}
            position={[member.lat, member.lng]}
            icon={memberIcon}
          >
            <Popup>{member.name}</Popup>
          </Marker>
        ))}

        {midpoint ? (
          <Marker position={[midpoint.lat, midpoint.lng]} icon={midpointIcon}>
            <Popup>Titik tengah</Popup>
          </Marker>
        ) : null}

        {venues.map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.lat, venue.lng]}
            icon={venue.id === selectedVenueId ? selectedVenueIcon : venueIcon}
            zIndexOffset={venue.id === selectedVenueId ? 600 : 0}
          >
            <Popup>{venue.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
