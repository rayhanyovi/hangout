"use client";

import { useState } from "react";
import {
  Check,
  Crosshair,
  Loader2,
  MapPinned,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  applyPrivacyModeToLocation,
  PRIVACY_RULES,
  type LocationSource,
  type MemberLocation,
  type PrivacyMode,
} from "@/lib/contracts";
import type { DraftRoomMember } from "@/lib/rooms";
import { joinRoomSchema, updateMemberLocationSchema } from "@/lib/validation";

type RoomMemberManagerProps = {
  inviteLink: string;
  members: DraftRoomMember[];
  privacyMode: PrivacyMode;
  mode?: "preview" | "live";
  currentMemberId?: string | null;
  onAddMember?: (displayName: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberLocation: (
    memberId: string,
    location: MemberLocation,
  ) => void | Promise<void>;
};

const displayNameSchema = joinRoomSchema.shape.displayName;
const locationSchema = updateMemberLocationSchema.shape.location;

export function RoomMemberManager({
  inviteLink,
  members,
  privacyMode,
  mode = "preview",
  currentMemberId = null,
  onAddMember,
  onRemoveMember,
  onUpdateMemberLocation,
}: RoomMemberManagerProps) {
  const [pendingName, setPendingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const sharedCount = members.filter((member) => member.location !== null).length;
  const pendingCount = members.length - sharedCount;
  const privacyRule = PRIVACY_RULES[privacyMode];
  const isLiveMode = mode === "live";

  const handleAddMember = () => {
    if (!onAddMember) {
      return;
    }

    const parsed = displayNameSchema.safeParse(pendingName.trim());

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Member name is not valid.");
      return;
    }

    setError(null);
    onAddMember(parsed.data);
    setPendingName("");
  };

  const saveLocation = async (
    memberId: string,
    locationInput: {
      lat: number;
      lng: number;
      source: LocationSource;
      accuracyM?: number;
    },
  ) => {
    const parsed = locationSchema.safeParse(
      applyPrivacyModeToLocation(
        {
          ...locationInput,
          updatedAt: new Date().toISOString(),
        },
        privacyMode,
      ),
    );

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Location is not valid.");
      return false;
    }

    setError(null);
    await onUpdateMemberLocation(memberId, parsed.data);
    return true;
  };

  const handleCurrentLocation = (memberId: string) => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not available. Use manual coordinates instead.");
      return;
    }

    setLoadingMemberId(memberId);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await saveLocation(memberId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "gps",
          accuracyM: position.coords.accuracy,
        });
        setLoadingMemberId(null);
      },
      () => {
        setLoadingMemberId(null);
        setError("Unable to capture browser location. Try manual coordinates.");
      },
      {
        enableHighAccuracy: privacyMode === "exact",
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  const startManualEdit = (member: DraftRoomMember) => {
    setEditingMemberId(member.id);
    setManualLat(member.location ? String(member.location.lat) : "");
    setManualLng(member.location ? String(member.location.lng) : "");
  };

  const handleManualSave = async (memberId: string) => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Latitude and longitude must both be numbers.");
      return;
    }

    const success = await saveLocation(memberId, {
      lat,
      lng,
      source: "pinned",
    });

    if (success) {
      setEditingMemberId(null);
    }
  };

  return (
    <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted" />
        <h2 className="text-lg font-semibold text-foreground">
          Member management
        </h2>
      </div>

      <div className="mt-4 grid gap-3 rounded-[1.4rem] border border-line bg-white/78 p-4 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Total members
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{members.length}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Shared location
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{sharedCount}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Pending location
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{pendingCount}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-line bg-white/82 p-4 text-sm leading-7 text-muted">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Privacy mode
        </p>
        <p className="mt-2 text-sm font-semibold capitalize text-foreground">
          {privacyMode} · {privacyRule.locationPrecisionDecimals} decimals
        </p>
        <p className="mt-2">{privacyRule.description}</p>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-dashed border-line bg-white/80 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Invite route
        </p>
        <p className="mt-2 break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-foreground">
          {inviteLink}
        </p>
        <p className="mt-3 text-xs text-muted">
          {isLiveMode
            ? "Roster bertambah saat orang join lewat link atau join code ini."
            : "Preview mode masih mengizinkan host menambah slot member secara lokal."}
        </p>
      </div>

      {!isLiveMode ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Add member
            </span>
            <input
              value={pendingName}
              onChange={(event) => setPendingName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddMember();
                }
              }}
              placeholder="Type a member name"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
            />
          </label>
          <button
            type="button"
            onClick={handleAddMember}
            className="inline-flex items-center justify-center gap-2 self-end rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-7 text-muted">
          Live room mode membatasi update lokasi ke member yang sedang masuk
          dari device ini.
        </p>
      )}

      {error ? <p className="mt-3 text-sm font-medium text-coral">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {members.map((member) => {
          const locationLocked = member.id === "invite-slot";
          const canUpdateThisMember =
            !isLiveMode || (currentMemberId !== null && member.id === currentMemberId);

          return (
            <div
              key={member.id}
              className="rounded-[1.4rem] border border-line bg-white/78 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {member.displayName}
                    </p>
                    <span className="rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {member.role}
                    </span>
                    {currentMemberId === member.id ? (
                      <span className="rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-background">
                        you
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{member.statusLabel}</p>
                  {member.location ? (
                    <p className="mt-2 font-mono text-[11px] text-muted">
                      {member.location.lat.toFixed(privacyRule.locationPrecisionDecimals)},{" "}
                      {member.location.lng.toFixed(privacyRule.locationPrecisionDecimals)} ·{" "}
                      {member.location.source}
                      {member.location.accuracyM
                        ? ` · ±${Math.round(member.location.accuracyM)}m`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Location pending</p>
                  )}
                </div>

                {!isLiveMode ? (
                  <button
                    type="button"
                    onClick={() => onRemoveMember?.(member.id)}
                    disabled={member.role === "host"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${member.displayName}`}
                    title={
                      member.role === "host"
                        ? "Host stays in the room"
                        : `Remove ${member.displayName}`
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCurrentLocation(member.id)}
                  disabled={
                    loadingMemberId === member.id ||
                    locationLocked ||
                    !canUpdateThisMember
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingMemberId === member.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  Use current location
                </button>
                <button
                  type="button"
                  onClick={() => startManualEdit(member)}
                  disabled={locationLocked || !canUpdateThisMember}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  Enter coordinates
                </button>
              </div>

              {locationLocked ? (
                <p className="mt-3 text-xs text-muted">
                  Invite slot stays passive until a real member joins.
                </p>
              ) : null}

              {isLiveMode && !canUpdateThisMember ? (
                <p className="mt-3 text-xs text-muted">
                  Tiap member update lokasinya sendiri dari device mereka.
                </p>
              ) : null}

              {editingMemberId === member.id ? (
                <div className="mt-4 grid gap-3 rounded-[1.2rem] border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <input
                    value={manualLat}
                    onChange={(event) => setManualLat(event.target.value)}
                    placeholder="Latitude"
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
                  />
                  <input
                    value={manualLng}
                    onChange={(event) => setManualLng(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleManualSave(member.id);
                      }
                    }}
                    placeholder="Longitude"
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
                  />
                  <button
                    type="button"
                    onClick={() => void handleManualSave(member.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMemberId(null)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
