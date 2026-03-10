"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordinate } from "@/lib/contracts";
import type { RoomMapMember, RoomMapVenue } from "@/components/maps/room-map";

const memberIcon = new L.DivIcon({
  html: `<div style="background:#df6f4f;width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;border:3px solid white;box-shadow:0 10px 24px rgba(31,27,23,0.18);">M</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

const midpointIcon = new L.DivIcon({
  html: `<div style="background:#1d7c73;width:38px;height:38px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 10px 24px rgba(31,27,23,0.18);">+</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  className: "",
});

const venueIcon = new L.DivIcon({
  html: `<div style="background:#f4be64;width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:#1f1b17;font-weight:700;font-size:11px;border:3px solid white;box-shadow:0 10px 24px rgba(31,27,23,0.16);">V</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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

type RoomMapClientProps = {
  members: RoomMapMember[];
  venues?: RoomMapVenue[];
  midpoint?: Coordinate | null;
  radiusM?: number;
};

export function RoomMapClient({
  members,
  venues = [],
  midpoint = null,
  radiusM,
}: RoomMapClientProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
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

        {midpoint && radiusM ? (
          <Circle
            center={[midpoint.lat, midpoint.lng]}
            radius={radiusM}
            pathOptions={{
              color: "#1d7c73",
              fillColor: "#1d7c73",
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
          <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={venueIcon}>
            <Popup>{venue.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
