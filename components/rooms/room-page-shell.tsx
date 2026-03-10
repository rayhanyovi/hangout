"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, MapPinned, ShieldCheck, TimerReset } from "lucide-react";
import {
  getRoomDecisionRoute,
  getRoomRoute,
  type MemberLocation,
  type RoomSnapshot,
  type Vote,
  type VenueCategory,
} from "@/lib/contracts";
import {
  buildDraftRoomMembers,
  buildMidpointFairnessSummary,
  createPendingDraftRoomMember,
  mapSnapshotMembersToDraftMembers,
  memberHasLocation,
  type DraftRoomMember,
  type DraftRoomSeed,
  type RankedVenue,
} from "@/lib/rooms";
import { RoomMap } from "@/components/maps/room-map";
import { RoomMemberManager } from "@/components/rooms/room-member-manager";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { RoomVotingPanel } from "@/components/rooms/room-voting-panel";
import { VenueShortlist } from "@/components/rooms/venue-shortlist";
import { JoinRoomInline } from "@/components/rooms/join-room-inline";

type RoomPageShellProps = {
  joinCode: string;
  draftSeed: DraftRoomSeed;
  initialMembers?: DraftRoomMember[];
  liveRoomContext?: {
    currentMemberId: string | null;
    initialVotes?: Vote[];
    finalizedVenueId?: string | null;
  };
};

type VenueSearchResponse = {
  venues: RankedVenue[];
  message?: string;
};

type RoomUpdateResponse = {
  snapshot: RoomSnapshot;
  message?: string;
};

type VoteMutationResponse = {
  snapshot: RoomSnapshot;
  message?: string;
};

type AsyncStatus = "idle" | "loading" | "success" | "timeout" | "error";

const DEFAULT_PREVIEW_CATEGORIES: VenueCategory[] = ["cafe", "restaurant"];
const ROOM_ACTION_TIMEOUT_MS = 10000;

export function RoomPageShell({
  joinCode,
  draftSeed,
  initialMembers,
  liveRoomContext,
}: RoomPageShellProps) {
  const isLiveRoom = liveRoomContext !== undefined;
  const [members, setMembers] = useState<DraftRoomMember[]>(
    () => initialMembers ?? buildDraftRoomMembers(draftSeed),
  );
  const [venues, setVenues] = useState<RankedVenue[]>([]);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeVenueCategories, setActiveVenueCategories] = useState<
    VenueCategory[]
  >([]);
  const [roomSyncError, setRoomSyncError] = useState<string | null>(null);
  const [roomSyncStatus, setRoomSyncStatus] = useState<AsyncStatus>(
    isLiveRoom ? "loading" : "success",
  );
  const [votes, setVotes] = useState<Vote[]>(() => liveRoomContext?.initialVotes ?? []);
  const [finalizedVenueId, setFinalizedVenueId] = useState<string | null>(
    () => liveRoomContext?.finalizedVenueId ?? null,
  );
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [venueStatus, setVenueStatus] = useState<AsyncStatus>("idle");

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
  const fairnessSummary = useMemo(
    () => buildMidpointFairnessSummary(mappedMembers),
    [mappedMembers],
  );
  const midpoint = fairnessSummary.midpoint;
  const midpointLat = midpoint?.lat ?? null;
  const midpointLng = midpoint?.lng ?? null;
  const requestedVenueCategories = useMemo<VenueCategory[]>(
    () =>
      draftSeed.categories.length > 0
        ? draftSeed.categories
        : DEFAULT_PREVIEW_CATEGORIES,
    [draftSeed.categories],
  );
  const requestedCategoryParam = requestedVenueCategories.join(",");
  const requestedTagParam = draftSeed.tags.join(",");
  const availableVenueFilters = useMemo(
    () =>
      Array.from(
        new Set([
          ...requestedVenueCategories,
          ...venues.map((venue) => venue.category),
        ]),
      ),
    [requestedVenueCategories, venues],
  );
  const currentMemberId = liveRoomContext?.currentMemberId ?? null;
  const hostMemberId =
    members.find((member) => member.role === "host")?.id ?? null;
  const viewerHasJoined =
    !isLiveRoom ||
    (currentMemberId !== null &&
      members.some((member) => member.id === currentMemberId));
  const inviteLink = getRoomRoute(joinCode);
  const needsMoreLocations = mappedMembers.length < 2;
  const showVenueEmptyState =
    midpoint !== null &&
    !isVenueLoading &&
    venueError === null &&
    venues.length === 0 &&
    venueStatus !== "loading";
  const finalizedVenueName =
    finalizedVenueId !== null
      ? venues.find((venue) => venue.venueId === finalizedVenueId)?.name ??
        finalizedVenueId
      : null;
  const decisionRoute = getRoomDecisionRoute(joinCode);

  const handleAddMember = (displayName: string) => {
    if (isLiveRoom) {
      return;
    }

    setMembers((current) => [...current, createPendingDraftRoomMember(displayName)]);
  };

  const handleRemoveMember = (memberId: string) => {
    if (isLiveRoom) {
      return;
    }

    setMembers((current) =>
      current.filter((member) => member.id !== memberId || member.role === "host"),
    );
  };

  const handleUpdateMemberLocation = async (
    memberId: string,
    location: MemberLocation,
  ) => {
    if (!isLiveRoom) {
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                location,
                statusLabel:
                  location.source === "gps"
                    ? "Shared from current device"
                    : "Pinned manually in the room shell",
              }
            : member,
        ),
      );
      return;
    }

    if (!currentMemberId || currentMemberId !== memberId) {
      return;
    }

    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              location,
              statusLabel:
                location.source === "gps"
                  ? "Shared from current device"
                  : "Pinned manually in the room shell",
            }
          : member,
        ),
    );
    setRoomSyncError(null);

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, ROOM_ACTION_TIMEOUT_MS);

    try {
      const response = await fetch(`/api/rooms/${joinCode}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          memberId,
          location,
        }),
      });
      const payload = (await response.json()) as RoomUpdateResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Location update failed.");
      }

      setMembers(mapSnapshotMembersToDraftMembers(payload.snapshot));
      setVotes(payload.snapshot.votes);
      setFinalizedVenueId(payload.snapshot.room.finalizedDecision?.venueId ?? null);
      setRoomSyncError(null);
      setRoomSyncStatus("success");
    } catch (error) {
      setRoomSyncError(
        didTimeout
          ? "Location update timed out before the room snapshot was refreshed."
          : error instanceof Error
            ? error.message
            : "Location update failed.",
      );
      setRoomSyncStatus(didTimeout ? "timeout" : "error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleToggleVenueCategory = (category: VenueCategory) => {
    setActiveVenueCategories((current) => {
      if (current.length === 0) {
        return [category];
      }

      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
    });
  };

  const handleCastVote = async (venueId: string) => {
    if (!isLiveRoom || !currentMemberId) {
      return;
    }

    setIsVoteSubmitting(true);
    setVoteError(null);
    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, ROOM_ACTION_TIMEOUT_MS);

    try {
      const response = await fetch(`/api/rooms/${joinCode}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          memberId: currentMemberId,
          venueId,
        }),
      });
      const payload = (await response.json()) as VoteMutationResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Vote update failed.");
      }

      setVotes(payload.snapshot.votes);
      setFinalizedVenueId(payload.snapshot.room.finalizedDecision?.venueId ?? null);
      setVoteError(null);
    } catch (error) {
      setVoteError(
        didTimeout
          ? "Vote update timed out before the room state was refreshed."
          : error instanceof Error
            ? error.message
            : "Vote update failed.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsVoteSubmitting(false);
    }
  };

  const handleFinalizeVenue = async (venueId: string) => {
    if (!isLiveRoom || !currentMemberId) {
      return;
    }

    setIsVoteSubmitting(true);
    setVoteError(null);
    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, ROOM_ACTION_TIMEOUT_MS);

    try {
      const response = await fetch(`/api/rooms/${joinCode}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          memberId: currentMemberId,
          venueId,
        }),
      });
      const payload = (await response.json()) as VoteMutationResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Room finalization failed.");
      }

      setVotes(payload.snapshot.votes);
      setFinalizedVenueId(payload.snapshot.room.finalizedDecision?.venueId ?? null);
      setVoteError(null);
    } catch (error) {
      setVoteError(
        didTimeout
          ? "Room finalization timed out before the decision was locked."
          : error instanceof Error
            ? error.message
            : "Room finalization failed.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsVoteSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLiveRoom) {
      return;
    }

    let cancelled = false;
    let activeController: AbortController | null = null;
    let isFetching = false;

    const syncRoomSnapshot = async () => {
      if (isFetching) {
        return;
      }

      isFetching = true;
      const controller = new AbortController();
      activeController = controller;
      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, 6000);

      try {
        setRoomSyncStatus((current) =>
          current === "success" ? current : "loading",
        );
        const response = await fetch(`/api/rooms/${joinCode}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | RoomSnapshot
          | {
              message?: string;
            };

        if (!response.ok) {
          const errorPayload = payload as { message?: string };
          throw new Error(errorPayload.message ?? "Room sync failed.");
        }
        const snapshot = payload as RoomSnapshot;

        if (!cancelled) {
          setMembers(mapSnapshotMembersToDraftMembers(snapshot));
          setVotes(snapshot.votes);
          setFinalizedVenueId(snapshot.room.finalizedDecision?.venueId ?? null);
          setRoomSyncError(null);
          setRoomSyncStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          if (didTimeout) {
            setRoomSyncError("Room sync is taking longer than expected.");
            setRoomSyncStatus("timeout");
            return;
          }

          setRoomSyncError(
            error instanceof Error ? error.message : "Room sync failed.",
          );
          setRoomSyncStatus("error");
        }
      } finally {
        if (activeController === controller) {
          activeController = null;
        }
        isFetching = false;
        window.clearTimeout(timeoutId);
      }
    };

    void syncRoomSnapshot();
    const interval = window.setInterval(() => {
      void syncRoomSnapshot();
    }, 4000);

    return () => {
      cancelled = true;
      activeController?.abort();
      window.clearInterval(interval);
    };
  }, [isLiveRoom, joinCode]);

  useEffect(() => {
    if (mappedMembers.length < 2 || midpointLat === null || midpointLng === null) {
      setVenues([]);
      setIsVenueLoading(false);
      setVenueError(null);
      setVenueStatus("idle");
      return;
    }

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 12000);
    const params = new URLSearchParams({
      lat: String(midpointLat),
      lng: String(midpointLng),
      radiusM: String(draftSeed.radiusMDefault),
      categories: requestedCategoryParam,
      tags: requestedTagParam,
      limit: "8",
    });

    if (draftSeed.budget) {
      params.set("budget", draftSeed.budget);
    }

    if (isLiveRoom) {
      params.set("joinCode", joinCode);
    }

    setIsVenueLoading(true);
    setVenueStatus("loading");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/venues/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await response.json()) as VenueSearchResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "Venue provider request failed.");
        }

        setVenues(payload.venues);
        setVenueError(null);
        setVenueStatus("success");
      } catch (error) {
        if (controller.signal.aborted) {
          if (didTimeout) {
            setVenueError("Venue provider timed out before results were ready.");
            setVenues([]);
            setVenueStatus("timeout");
          }
          return;
        }

        setVenues([]);
        setVenueError(
          error instanceof Error
            ? error.message
            : "Venue provider request failed.",
        );
        setVenueStatus("error");
      } finally {
        setIsVenueLoading(false);
        window.clearTimeout(timeoutId);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.clearTimeout(timeoutId);
    };
  }, [
    midpointLat,
    midpointLng,
    draftSeed.radiusMDefault,
    draftSeed.budget,
    requestedCategoryParam,
    requestedTagParam,
    isLiveRoom,
    joinCode,
    mappedMembers.length,
  ]);

  useEffect(() => {
    if (venues.length === 0) {
      setSelectedVenueId(null);
      return;
    }

    setSelectedVenueId((current) =>
      current && venues.some((venue) => venue.venueId === current)
        ? current
        : venues[0]?.venueId ?? null,
    );
  }, [venues]);

  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <span className="h-2 w-2 rounded-full bg-teal" />
                {draftSeed.previewMode ? "Preview room shell" : "Live room"}
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/rooms/new"
                  className="flex-1 rounded-full border border-line bg-surface px-4 py-3 text-center font-semibold transition hover:-translate-y-0.5"
                >
                  {isLiveRoom ? "New room" : "Edit setup"}
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
                value: draftSeed.previewMode ? "draft preview" : "persisted room",
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

        {isLiveRoom && !viewerHasJoined ? (
          <JoinRoomInline initialJoinCode={joinCode} compact />
        ) : null}

        <div className="space-y-4">
          {isLiveRoom && !viewerHasJoined ? (
            <RoomStatusBanner
              tone="info"
              title="Join this room before interacting."
              description="Masuk dulu sebagai member supaya device kamu bisa kirim lokasi, vote venue, dan ikut final decision di room yang sama."
            />
          ) : null}

          {isLiveRoom && roomSyncStatus === "loading" ? (
            <RoomStatusBanner
              tone="info"
              title="Syncing the live room."
              description="Snapshot room sedang di-refresh dari server supaya roster, vote, dan decision state tetap konsisten."
            />
          ) : null}

          {roomSyncStatus === "timeout" ? (
            <RoomStatusBanner
              tone="warning"
              title="Room sync is slower than expected."
              description={
                roomSyncError ??
                "Snapshot room belum kembali dari server. Tunggu sebentar atau ulangi aksi terakhir."
              }
            />
          ) : null}

          {roomSyncStatus === "error" && roomSyncError ? (
            <RoomStatusBanner
              tone="error"
              title="Room sync failed."
              description={roomSyncError}
            />
          ) : null}

          {needsMoreLocations ? (
            <RoomStatusBanner
              tone="info"
              title="Need more member locations."
              description="Midpoint dan venue shortlist baru dihitung setelah minimal dua member berhasil share lokasi."
            />
          ) : null}

          {!needsMoreLocations && venueStatus === "loading" ? (
            <RoomStatusBanner
              tone="info"
              title="Searching nearby venues."
              description="Provider venue sedang mencari kandidat di sekitar midpoint room ini."
            />
          ) : null}

          {venueStatus === "timeout" ? (
            <RoomStatusBanner
              tone="warning"
              title="Venue provider is taking too long."
              description={
                venueError ??
                "Request venue belum selesai tepat waktu. Coba tunggu polling berikutnya atau perbarui data room."
              }
            />
          ) : null}

          {venueStatus === "error" && venueError ? (
            <RoomStatusBanner
              tone="error"
              title="Venue provider failed."
              description={venueError}
            />
          ) : null}

          {showVenueEmptyState ? (
            <RoomStatusBanner
              tone="warning"
              title="No venues matched this room yet."
              description="Filter kategori, radius, atau tag saat ini belum menghasilkan shortlist yang layak. Ubah preferensi room atau tunggu midpoint bergeser."
            />
          ) : null}

          {finalizedVenueName ? (
            <RoomStatusBanner
              tone="success"
              title="Room decision has been finalized."
              description={`Venue ${finalizedVenueName} sudah dikunci. Lanjut ke decision route ${decisionRoute} untuk handoff Maps dan recap voting.`}
            />
          ) : null}
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <RoomMemberManager
              inviteLink={inviteLink}
              members={members}
              privacyMode={draftSeed.privacyMode}
              mode={isLiveRoom ? "live" : "preview"}
              currentMemberId={currentMemberId}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberLocation={handleUpdateMemberLocation}
            />

            <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Venue preferences
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {requestedVenueCategories.map((category) => (
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
              selectedVenueId={selectedVenueId}
              venues={venues.map((venue) => ({
                id: venue.venueId,
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
                {fairnessSummary.rows.length > 0 ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                          Midpoint
                        </p>
                        <p className="mt-2 font-mono text-xs text-foreground">
                          {midpoint?.lat.toFixed(4)}, {midpoint?.lng.toFixed(4)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                          Average detour
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {fairnessSummary.averageDistanceKm?.toFixed(1)} km
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                          Distance spread
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {fairnessSummary.spreadKm?.toFixed(1)} km
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {fairnessSummary.rows.map((row) => (
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
                  </>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-muted">
                    Fairness summary will appear after at least two members have
                    shared a location in the room shell.
                  </p>
                )}
              </article>

              <div className="space-y-6">
                <VenueShortlist
                  venues={venues}
                  activeCategories={activeVenueCategories}
                  onToggleCategory={handleToggleVenueCategory}
                  onSelectVenue={setSelectedVenueId}
                  isLoading={isVenueLoading}
                  errorMessage={venueError}
                  categories={availableVenueFilters}
                  hasMidpoint={midpoint !== null}
                  selectedVenueId={selectedVenueId}
                />

                {isLiveRoom ? (
                  <RoomVotingPanel
                    venues={venues}
                    votes={votes}
                    selectedVenueId={selectedVenueId}
                    currentMemberId={currentMemberId}
                    hostMemberId={hostMemberId}
                    finalizedVenueId={finalizedVenueId}
                    isSubmitting={isVoteSubmitting}
                    errorMessage={voteError}
                    onVote={handleCastVote}
                    onFinalize={handleFinalizeVenue}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
