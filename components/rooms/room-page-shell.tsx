"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass, MapPinned, ShieldCheck, TimerReset } from "lucide-react";
import { type VenueCategory, getRoomDecisionRoute, getRoomRoute } from "@/lib/contracts";
import {
  buildDraftRoomMembers,
  createPendingDraftRoomMember,
  memberHasLocation,
  type DraftRoomMember,
  type DraftRoomSeed,
} from "@/lib/rooms";
import { computeGeometricMedian, haversineKm } from "@/lib/math";
import { RoomMap } from "@/components/maps/room-map";
import { RoomMemberManager } from "@/components/rooms/room-member-manager";

type RoomPageShellProps = {
  joinCode: string;
  draftSeed: DraftRoomSeed;
};

const SAMPLE_VENUES: Record<
  VenueCategory,
  Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    tone: string;
  }>
> = {
  cafe: [
    { id: "kopi-tengah", name: "Kopi Tengah", lat: -6.1982, lng: 106.8331, tone: "Cafe" },
    { id: "morning-press", name: "Morning Press", lat: -6.2011, lng: 106.8299, tone: "Cafe" },
  ],
  restaurant: [
    { id: "garden-resto", name: "Green Garden Resto", lat: -6.2014, lng: 106.8362, tone: "Restaurant" },
    { id: "warung-kita", name: "Warung Kita", lat: -6.1978, lng: 106.8386, tone: "Restaurant" },
  ],
  park: [
    { id: "city-park", name: "City Park Pocket", lat: -6.2025, lng: 106.8315, tone: "Park" },
    { id: "langsat", name: "Taman Langsat", lat: -6.2052, lng: 106.8358, tone: "Park" },
  ],
  mall: [
    { id: "mall-central", name: "Central Mall", lat: -6.1966, lng: 106.8404, tone: "Mall" },
    { id: "atrium-east", name: "Atrium East", lat: -6.2034, lng: 106.8268, tone: "Mall" },
  ],
  other: [
    { id: "community-lab", name: "Community Lab", lat: -6.2007, lng: 106.8328, tone: "Other" },
    { id: "weekend-hall", name: "Weekend Hall", lat: -6.2041, lng: 106.8372, tone: "Other" },
  ],
};

const DEFAULT_PREVIEW_CATEGORIES: VenueCategory[] = ["cafe", "restaurant"];

function buildVenuePreview(draftSeed: DraftRoomSeed) {
  const categories: VenueCategory[] =
    draftSeed.categories.length > 0 ? draftSeed.categories : DEFAULT_PREVIEW_CATEGORIES;

  return categories
    .flatMap((category) => SAMPLE_VENUES[category])
    .slice(0, 4);
}

export function RoomPageShell({ joinCode, draftSeed }: RoomPageShellProps) {
  const [members, setMembers] = useState<DraftRoomMember[]>(() =>
    buildDraftRoomMembers(draftSeed),
  );
  const mappedMembers = useMemo(
    () =>
      members.filter(memberHasLocation).map((member) => ({
        id: member.id,
        name: member.displayName,
        lat: member.location.lat,
        lng: member.location.lng,
      })),
    [members],
  );
  const midpoint = useMemo(() => {
    if (mappedMembers.length < 2) {
      return null;
    }

    return computeGeometricMedian(mappedMembers);
  }, [mappedMembers]);
  const venues = buildVenuePreview(draftSeed);

  const fairnessRows = midpoint
    ? mappedMembers.map((member) => ({
        id: member.id,
        name: member.name,
        distanceKm: haversineKm(midpoint, { lat: member.lat, lng: member.lng }),
      }))
    : [];

  const inviteLink = getRoomRoute(joinCode);

  const handleAddMember = (displayName: string) => {
    setMembers((current) => [...current, createPendingDraftRoomMember(displayName)]);
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((current) =>
      current.filter((member) => member.id !== memberId || member.role === "host"),
    );
  };

  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <span className="h-2 w-2 rounded-full bg-teal" />
                {draftSeed.previewMode ? "Preview room shell" : "Room shell"}
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Join code
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl">
                  {draftSeed.title ?? `Room ${joinCode}`}
                </h1>
                <p className="mt-3 text-base leading-8 text-muted md:text-lg">
                  Route utama ini sudah berfungsi sebagai pusat koordinasi:
                  anggota, lokasi, midpoint, venue shortlist, voting, dan final
                  decision nantinya hidup di sini.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-line bg-white/76 p-5 text-sm text-ink-soft sm:min-w-[280px]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  Shareable route
                </p>
                <p className="mt-2 rounded-xl bg-surface px-3 py-2 font-mono text-xs">
                  {inviteLink}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/rooms/new"
                  className="flex-1 rounded-full border border-line bg-surface px-4 py-3 text-center font-semibold transition hover:-translate-y-0.5"
                >
                  Edit setup
                </Link>
                <Link
                  href={getRoomDecisionRoute(joinCode)}
                  className="flex-1 rounded-full bg-foreground px-4 py-3 text-center font-semibold text-background transition hover:-translate-y-0.5"
                >
                  Preview decision
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              {
                icon: Compass,
                label: "Transport",
                value: draftSeed.transportMode,
              },
              {
                icon: ShieldCheck,
                label: "Privacy",
                value: draftSeed.privacyMode,
              },
              {
                icon: MapPinned,
                label: "Radius",
                value:
                  draftSeed.radiusMDefault >= 1000
                    ? `${draftSeed.radiusMDefault / 1000} km`
                    : `${draftSeed.radiusMDefault} m`,
              },
              {
                icon: TimerReset,
                label: "Flow mode",
                value: draftSeed.previewMode ? "draft preview" : "server state",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-line bg-white/78 p-4"
              >
                <item.icon className="h-4 w-4 text-muted" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <RoomMemberManager
              inviteLink={inviteLink}
              members={members}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />

            <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Venue preferences
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(draftSeed.categories.length > 0
                  ? draftSeed.categories
                  : DEFAULT_PREVIEW_CATEGORIES
                ).map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {draftSeed.tags.length > 0
                  ? `Soft tags: ${draftSeed.tags.join(", ")}.`
                  : "Soft tags belum dipasang; venue shortlist akan mulai dari kategori inti."}
              </p>
            </article>
          </div>

          <div className="space-y-6">
            <RoomMap
              members={mappedMembers}
              midpoint={midpoint}
              radiusM={draftSeed.radiusMDefault}
              venues={venues.map((venue) => ({
                id: venue.id,
                name: venue.name,
                lat: venue.lat,
                lng: venue.lng,
              }))}
            />

            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  Fairness shell
                </p>
                {fairnessRows.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {fairnessRows.map((row) => (
                      <div key={row.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{row.name}</span>
                          <span className="text-muted">{row.distanceKm.toFixed(1)} km</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/90">
                          <div
                            className="h-full rounded-full bg-teal"
                            style={{ width: `${Math.min(100, (row.distanceKm / 12) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-muted">
                    Fairness summary will appear after at least two members have
                    shared a location in the room shell.
                  </p>
                )}
              </article>

              <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  Venue shortlist shell
                </p>
                <div className="mt-4 space-y-3">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="rounded-[1.3rem] border border-line bg-white/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {venue.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                            {venue.tone}
                          </p>
                        </div>
                        {midpoint ? (
                          <span className="text-xs font-medium text-muted">
                            {Math.round(
                              haversineKm(midpoint, { lat: venue.lat, lng: venue.lng }) * 1000,
                            )}
                            m
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
