"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Crosshair, Pencil, X } from "lucide-react";
import {
  type AddRoomMemberOutput,
  getRoomDecisionRoute,
  getRoomRoute,
  VENUE_CATEGORIES,
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
  persistRoomMemberCookie,
  type DraftRoomMember,
  type DraftRoomSeed,
  type RankedVenue,
} from "@/lib/rooms";
import { RoomMap } from "@/components/maps/room-map";
import { JoinRoomModal } from "@/components/rooms/join-room-modal";
import { RoomMembersModal } from "@/components/rooms/room-members-modal";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { VenueShortlist } from "@/components/rooms/venue-shortlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { SelectOption } from "@/components/ui/select";

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

type RoomDetailsMutationResponse = {
  snapshot: RoomSnapshot;
  message?: string;
};

type AddMemberResponse = AddRoomMemberOutput & {
  message?: string;
};

type AsyncStatus = "idle" | "loading" | "success" | "timeout" | "error";
const ROOM_ACTION_TIMEOUT_MS = 10000;
const ROOM_RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000] as const;

export function RoomPageShell({
  joinCode,
  draftSeed,
  initialMembers,
  liveRoomContext,
}: RoomPageShellProps) {
  const { toast } = useToast();
  const isLiveRoom = liveRoomContext !== undefined;
  const [members, setMembers] = useState<DraftRoomMember[]>(
    () => initialMembers ?? buildDraftRoomMembers(draftSeed),
  );
  const [venues, setVenues] = useState<RankedVenue[]>([]);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedVenueCategories, setSelectedVenueCategories] = useState<string[]>(
    () => draftSeed.categories,
  );
  const [searchRadiusM, setSearchRadiusM] = useState(draftSeed.radiusMDefault);
  const [roomTitle, setRoomTitle] = useState(draftSeed.title ?? "");
  const [roomDescription, setRoomDescription] = useState(
    draftSeed.description ?? "",
  );
  const [roomScheduledLabel, setRoomScheduledLabel] = useState(
    draftSeed.scheduledLabel ?? "",
  );
  const [savedRoomDescription, setSavedRoomDescription] = useState(
    draftSeed.description ?? "",
  );
  const [savedRoomScheduledLabel, setSavedRoomScheduledLabel] = useState(
    draftSeed.scheduledLabel ?? "",
  );
  const [isSavingRoomDetails, setIsSavingRoomDetails] = useState(false);
  const [isEditingRoomDetails, setIsEditingRoomDetails] = useState(false);
  const [roomSyncError, setRoomSyncError] = useState<string | null>(null);
  const [roomSyncStatus, setRoomSyncStatus] = useState<AsyncStatus>(
    isLiveRoom ? "loading" : "success",
  );
  const [votes, setVotes] = useState<Vote[]>(
    () => liveRoomContext?.initialVotes ?? [],
  );
  const [finalizedVenueId, setFinalizedVenueId] = useState<string | null>(
    () => liveRoomContext?.finalizedVenueId ?? null,
  );
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [venueStatus, setVenueStatus] = useState<AsyncStatus>("idle");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersFocusRequestKey, setMembersFocusRequestKey] = useState(0);
  const [membersFocusMemberId, setMembersFocusMemberId] = useState<
    string | null
  >(null);
  const previousFinalizedVenueIdRef = useRef<string | null>(
    liveRoomContext?.finalizedVenueId ?? null,
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
  const fairnessSummary = useMemo(
    () => buildMidpointFairnessSummary(mappedMembers, draftSeed.transportMode),
    [mappedMembers, draftSeed.transportMode],
  );
  const maxDistanceKm = Math.max(
    ...fairnessSummary.rows.map((row) => row.distanceKm),
    1,
  );
  const midpoint = fairnessSummary.midpoint;
  const midpointLat = midpoint?.lat ?? null;
  const midpointLng = midpoint?.lng ?? null;
  const activeVenueCategories = useMemo<VenueCategory[]>(
    () =>
      selectedVenueCategories.filter(
        (category): category is VenueCategory =>
          VENUE_CATEGORIES.includes(category as VenueCategory),
      ),
    [selectedVenueCategories],
  );
  const searchCategoryParam = activeVenueCategories.join(",");
  const requestedTagParam = draftSeed.tags.join(",");
  const searchCategoryOptions = useMemo(
    () => VENUE_CATEGORIES.filter((category) => category !== "other"),
    [],
  );
  const venueCategorySelectOptions = useMemo<SelectOption[]>(
    () =>
      searchCategoryOptions.map((category) => ({
        label: category[0]?.toUpperCase() + category.slice(1),
        value: category,
      })),
    [searchCategoryOptions],
  );
  const venueRadiusSelectOptions = useMemo<SelectOption[]>(
    () =>
      ROOM_RADIUS_OPTIONS.map((option) => ({
        label: option >= 1000 ? `${option / 1000} km` : `${option} m`,
        value: String(option),
      })),
    [],
  );
  const currentMemberId = liveRoomContext?.currentMemberId ?? null;
  const hostMemberId =
    members.find((member) => member.role === "host")?.id ?? null;
  const isCurrentMemberHost =
    currentMemberId !== null && currentMemberId === hostMemberId;
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
  const sharedCount = members.filter(
    (member) => member.location !== null,
  ).length;
  const pendingCount = members.length - sharedCount;
  const fallbackRoomDescription =
    "Kumpulkan lokasi semua orang, lihat titik temu yang adil, lalu pilih tempat yang paling cocok bareng-bareng.";
  const displayedRoomDescription =
    roomDescription.trim() || fallbackRoomDescription;
  const displayedScheduledLabel = roomScheduledLabel.trim() || "tentative";
  const formattedScheduledLabel = useMemo(() => {
    const trimmedValue = displayedScheduledLabel.trim();

    if (!trimmedValue || trimmedValue === "tentative") {
      return "tentative";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      const date = new Date(`${trimmedValue}T00:00:00`);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date);
      }
    }

    return trimmedValue;
  }, [displayedScheduledLabel]);

  const syncRoomSnapshotState = (snapshot: RoomSnapshot) => {
    setMembers(mapSnapshotMembersToDraftMembers(snapshot));
    setVotes(snapshot.votes);
    setFinalizedVenueId(snapshot.room.finalizedDecision?.venueId ?? null);
    setRoomTitle(snapshot.room.title ?? "");
    setRoomDescription(snapshot.room.description ?? "");
    setRoomScheduledLabel(snapshot.room.scheduledLabel ?? "");
    setSavedRoomDescription(snapshot.room.description ?? "");
    setSavedRoomScheduledLabel(snapshot.room.scheduledLabel ?? "");
  };

  const handleAddMember = (displayName: string) => {
    if (!isLiveRoom) {
      setMembers((current) => [
        ...current,
        createPendingDraftRoomMember(displayName),
      ]);
      return;
    }

    if (!currentMemberId || !isCurrentMemberHost) {
      return;
    }

    setRoomSyncError(null);
    setRoomSyncStatus("loading");

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, ROOM_ACTION_TIMEOUT_MS);

    void (async () => {
      try {
        const response = await fetch(`/api/rooms/${joinCode}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            actorMemberId: currentMemberId,
            displayName,
          }),
        });
        const payload = (await response.json()) as AddMemberResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "Gagal menambahkan anggota.");
        }

        syncRoomSnapshotState(payload.snapshot);
        setRoomSyncError(null);
        setRoomSyncStatus("success");
      } catch (error) {
        setRoomSyncError(
          didTimeout
            ? "Penambahan anggota terlalu lama. Coba lagi sebentar."
            : error instanceof Error
              ? error.message
              : "Gagal menambahkan anggota.",
        );
        setRoomSyncStatus(didTimeout ? "timeout" : "error");
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();
  };

  const handleRemoveMember = (memberId: string) => {
    if (isLiveRoom) {
      return;
    }

    setMembers((current) =>
      current.filter(
        (member) => member.id !== memberId || member.role === "host",
      ),
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

    if (
      !currentMemberId ||
      (!isCurrentMemberHost && currentMemberId !== memberId)
    ) {
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
          actorMemberId: currentMemberId,
          memberId,
          location,
        }),
      });
      const payload = (await response.json()) as RoomUpdateResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Location update failed.");
      }

      syncRoomSnapshotState(payload.snapshot);
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

      syncRoomSnapshotState(payload.snapshot);
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

      syncRoomSnapshotState(payload.snapshot);
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
    if (!isLiveRoom || !currentMemberId) {
      return;
    }

    persistRoomMemberCookie(joinCode, currentMemberId);
  }, [currentMemberId, isLiveRoom, joinCode]);

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
          syncRoomSnapshotState(snapshot);
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
    }, 10000);

    return () => {
      cancelled = true;
      activeController?.abort();
      window.clearInterval(interval);
    };
  }, [isLiveRoom, joinCode]);

  useEffect(() => {
    if (
      mappedMembers.length < 2 ||
      midpointLat === null ||
      midpointLng === null
    ) {
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
      radiusM: String(searchRadiusM),
      categories: searchCategoryParam,
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
        const response = await fetch(
          `/api/venues/search?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
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
            setVenueError(
              "Venue provider timed out before results were ready.",
            );
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
    searchRadiusM,
    draftSeed.budget,
    searchCategoryParam,
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
        : (venues[0]?.venueId ?? null),
    );
  }, [venues]);

  useEffect(() => {
    const previousFinalizedVenueId = previousFinalizedVenueIdRef.current;

    if (finalizedVenueId && finalizedVenueId !== previousFinalizedVenueId) {
      const finalizedVenueName =
        venues.find((venue) => venue.venueId === finalizedVenueId)?.name ??
        "pilihan akhir";

      toast({
        tone: "success",
        title: "Pilihan tempat sudah dikunci",
        description: `${finalizedVenueName} sekarang jadi hasil akhir room ini.`,
      });
    }

    previousFinalizedVenueIdRef.current = finalizedVenueId;
  }, [finalizedVenueId, toast, venues]);

  useEffect(() => {
    if (!inviteCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInviteCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inviteCopied]);

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
    } catch {
      setRoomSyncError("Link undangan belum bisa disalin dari browser ini.");
      setRoomSyncStatus("error");
    }
  };

  const handleSaveRoomDetails = async () => {
    if (!isLiveRoom || !currentMemberId || !isCurrentMemberHost) {
      return;
    }

    setIsSavingRoomDetails(true);
    setRoomSyncError(null);

    try {
      const response = await fetch(`/api/rooms/${joinCode}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorMemberId: currentMemberId,
          title: roomTitle.trim() || null,
          description: roomDescription.trim() || null,
          scheduledLabel: roomScheduledLabel.trim() || null,
        }),
      });
      const payload = (await response.json()) as RoomDetailsMutationResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Detail room belum berhasil disimpan.");
      }

      syncRoomSnapshotState(payload.snapshot);
      setRoomSyncError(null);
      setRoomSyncStatus("success");
      setIsEditingRoomDetails(false);
      toast({
        tone: "success",
        title: "Detail room disimpan",
        description: "Deskripsi dan waktu room sudah diperbarui.",
      });
    } catch (error) {
      setRoomSyncError(
        error instanceof Error
          ? error.message
          : "Detail room belum berhasil disimpan.",
      );
      setRoomSyncStatus("error");
    } finally {
      setIsSavingRoomDetails(false);
    }
  };

  const handleOpenMembersModal = (focusMemberId?: string | null) => {
    setMembersFocusMemberId(focusMemberId ?? null);
    setMembersFocusRequestKey((current) => current + 1);
    setIsMembersModalOpen(true);
  };

  if (isLiveRoom && !viewerHasJoined) {
    return <JoinRoomModal joinCode={joinCode} />;
  }

  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card className="relative rounded-[2rem] p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              {draftSeed.previewMode ? "Room baru" : "Room aktif"}
            </div>
            {isCurrentMemberHost ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isEditingRoomDetails) {
                    setRoomDescription(savedRoomDescription);
                    setRoomScheduledLabel(savedRoomScheduledLabel);
                    setIsEditingRoomDetails(false);
                    return;
                  }

                  setIsEditingRoomDetails(true);
                }}
                className="absolute right-6 top-6"
                aria-label={
                  isEditingRoomDetails ? "Batal edit detail room" : "Edit detail room"
                }
              >
                {isEditingRoomDetails ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
            ) : null}
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-primary md:text-5xl">
              {roomTitle.trim() || `Room ${joinCode}`}
            </h1>
            {isEditingRoomDetails ? (
              <div className="mt-6 grid gap-3 rounded-3xl border border-line bg-surface p-4">
                <div className="space-y-2">
                  <label
                    htmlFor="room-description"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                  >
                    Deskripsi
                  </label>
                  <textarea
                    id="room-description"
                    value={roomDescription}
                    onChange={(event) => setRoomDescription(event.target.value)}
                    placeholder={fallbackRoomDescription}
                    className="min-h-24 w-full rounded-3xl border border-line bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="room-scheduled-label"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                  >
                    Tanggal
                  </label>
                  <Input
                    id="room-scheduled-label"
                    type="date"
                    value={roomScheduledLabel}
                    onChange={(event) => setRoomScheduledLabel(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan kalau masih tentative.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSaveRoomDetails()}
                  disabled={isSavingRoomDetails}
                  className="w-full sm:w-fit"
                >
                  {isSavingRoomDetails ? "Menyimpan..." : "Simpan detail room"}
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-3 max-w-3xl text-base leading-8 text-foreground md:text-lg">
                  {displayedRoomDescription}
                </p>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Tanggal: {formattedScheduledLabel}
                </p>
              </>
            )}
            {finalizedVenueId ? (
              <Button asChild className="mt-5">
                <Link href={getRoomDecisionRoute(joinCode)}>
                  Lihat hasil akhir
                </Link>
              </Button>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-1">
            <Card className="rounded-[2rem] p-5 shadow-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Link undangan
              </p>
              <p className="mt-3 break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-foreground">
                https://hangout.rayhan.id/room/{joinCode}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => void handleCopyInviteLink()}
                  variant="secondary"
                >
                  {inviteCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {inviteCopied ? "Link tersalin" : "Copy link undangan"}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[2rem] p-5 shadow-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Anggota
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                <Button
                  type="button"
                  onClick={() => handleOpenMembersModal()}
                  variant="secondary"
                  className="h-auto justify-start rounded-2xl p-3 text-left"
                >
                  <span className="block">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Total anggota
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {members.length}
                    </p>
                  </span>
                </Button>
                <div className="rounded-2xl border border-line bg-surface p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Sudah share
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {sharedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Belum share
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {pendingCount}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleOpenMembersModal(currentMemberId)}
                variant="secondary"
                className="mt-4 w-full"
              >
                <Crosshair className="h-4 w-4" />
                Masukkan lokasi saya
              </Button>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          {isLiveRoom && roomSyncStatus === "loading" ? (
            <RoomStatusBanner
              tone="info"
              title="Memuat room."
              description="Data anggota, voting, dan pilihan tempat sedang disegarkan."
            />
          ) : null}

          {roomSyncStatus === "timeout" ? (
            <RoomStatusBanner
              tone="warning"
              title="Room belum selesai dimuat."
              description={
                roomSyncError ?? "Coba tunggu sebentar lalu ulangi lagi."
              }
            />
          ) : null}

          {roomSyncStatus === "error" && roomSyncError ? (
            <RoomStatusBanner
              tone="error"
              title="Room belum bisa dimuat."
              description={roomSyncError}
            />
          ) : null}

          {needsMoreLocations ? (
            <RoomStatusBanner
              tone="error"
              title="Butuh minimal dua lokasi."
              description="Minta setidaknya dua orang membagikan lokasi supaya titik temu dan rekomendasi tempat bisa dihitung."
            />
          ) : null}

          {!needsMoreLocations && venueStatus === "loading" ? (
            <RoomStatusBanner
              tone="info"
              title="Sedang mencari tempat."
              description="Kami lagi cari opsi tempat di sekitar titik temu grup."
            />
          ) : null}

          {venueStatus === "timeout" ? (
            <RoomStatusBanner
              tone="warning"
              title="Pencarian tempat lebih lama dari biasanya."
              description={
                venueError ?? "Coba tunggu sebentar atau ubah radius pencarian."
              }
            />
          ) : null}

          {venueStatus === "error" && venueError ? (
            <RoomStatusBanner
              tone="error"
              title="Tempat belum berhasil dimuat."
              description={venueError}
            />
          ) : null}

          {showVenueEmptyState ? (
            <RoomStatusBanner
              tone="warning"
              title="Belum ada tempat yang cocok."
              description="Coba ubah kategori atau radius supaya pilihan tempatnya lebih banyak."
            />
          ) : null}
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="space-y-6">
            <VenueShortlist
              venues={venues}
              activeCategories={activeVenueCategories}
              selectedCategories={selectedVenueCategories}
              selectedRadius={String(searchRadiusM)}
              categoryOptions={venueCategorySelectOptions}
              radiusOptions={venueRadiusSelectOptions}
              onCategoryChange={setSelectedVenueCategories}
              onRadiusChange={(value) => setSearchRadiusM(Number(value))}
              onSelectVenue={setSelectedVenueId}
              isLoading={isVenueLoading}
              errorMessage={venueError}
              hasMidpoint={midpoint !== null}
              selectedVenueId={selectedVenueId}
              votes={isLiveRoom ? votes : []}
              currentMemberId={currentMemberId}
              hostMemberId={hostMemberId}
              finalizedVenueId={finalizedVenueId}
              isSubmittingVote={isVoteSubmitting}
              voteError={voteError}
              onVote={isLiveRoom ? handleCastVote : undefined}
              onFinalize={isLiveRoom ? handleFinalizeVenue : undefined}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <RoomMap
              members={mappedMembers}
              midpoint={midpoint}
              radiusM={searchRadiusM}
              selectedVenueId={selectedVenueId}
              venues={venues.map((venue) => ({
                id: venue.venueId,
                name: venue.name,
                lat: venue.lat,
                lng: venue.lng,
              }))}
            />

            <Card className="bg-surface">
              <CardContent className="p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  Titik temu grup
                </p>
                {fairnessSummary.rows.length > 0 ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-line bg-card p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                          Midpoint
                        </p>
                        <p className="mt-2 font-mono text-xs text-foreground">
                          {midpoint?.lat.toFixed(4)}, {midpoint?.lng.toFixed(4)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line bg-card p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                          Rata-rata jarak
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {fairnessSummary.averageDistanceKm?.toFixed(1)} km
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line bg-card p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                          Selisih jarak
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {fairnessSummary.spreadKm?.toFixed(1)} km
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-6 text-foreground">
                      Bagian ini membantu kamu melihat seberapa adil titik temu
                      untuk semua orang di room.
                    </p>

                    <div className="mt-5 space-y-3">
                      {fairnessSummary.rows.map((row) => (
                        <div key={row.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">
                              {row.name}
                            </span>
                            <span className="text-foreground">
                              {row.distanceKm.toFixed(1)} km
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-soft">
                            <div
                              className="h-full rounded-full bg-success"
                              style={{
                                width: `${Math.min(100, (row.distanceKm / maxDistanceKm) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-foreground">
                    Titik temu akan muncul setelah minimal dua orang membagikan
                    lokasi mereka.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <RoomMembersModal
          open={isMembersModalOpen}
          members={members}
          privacyMode={draftSeed.privacyMode}
          mode={isLiveRoom ? "live" : "preview"}
          currentMemberId={currentMemberId}
          focusMemberId={membersFocusMemberId}
          focusRequestKey={membersFocusRequestKey}
          canAddMembers={!isLiveRoom || isCurrentMemberHost}
          canManageAllLocations={Boolean(isLiveRoom && isCurrentMemberHost)}
          onClose={() => {
            setIsMembersModalOpen(false);
            setMembersFocusMemberId(null);
          }}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdateMemberLocation={handleUpdateMemberLocation}
        />
      </div>
    </main>
  );
}
