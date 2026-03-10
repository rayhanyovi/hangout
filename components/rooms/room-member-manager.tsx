"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Crosshair,
  Loader2,
  Map,
  MapPinned,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  PRIVACY_RULES,
  type Coordinate,
  type LocationSource,
  type MemberLocation,
  type PrivacyMode,
} from "@/lib/contracts";
import { LocationPickerMap } from "@/components/maps/location-picker-map";
import { createValidatedMemberLocation, type DraftRoomMember } from "@/lib/rooms";
import { joinRoomSchema } from "@/lib/validation";

type RoomMemberManagerProps = {
  members: DraftRoomMember[];
  privacyMode: PrivacyMode;
  mode?: "preview" | "live";
  currentMemberId?: string | null;
  focusMemberId?: string | null;
  focusRequestKey?: number;
  canAddMembers?: boolean;
  canManageAllLocations?: boolean;
  onAddMember?: (displayName: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberLocation: (
    memberId: string,
    location: MemberLocation,
  ) => void | Promise<void>;
};

const displayNameSchema = joinRoomSchema.shape.displayName;

export function RoomMemberManager({
  members,
  privacyMode,
  mode = "preview",
  currentMemberId = null,
  focusMemberId = null,
  focusRequestKey = 0,
  canAddMembers = false,
  canManageAllLocations = false,
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
  const [pickedCoordinate, setPickedCoordinate] = useState<Coordinate | null>(null);

  const privacyRule = PRIVACY_RULES[privacyMode];
  const isLiveMode = mode === "live";

  useEffect(() => {
    if (!focusRequestKey || !focusMemberId) {
      return;
    }

    const targetElement = document.getElementById(
      `member-location-actions-${focusMemberId}`,
    );

    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    targetElement.classList.remove("location-actions-highlight");
    void targetElement.offsetWidth;
    targetElement.classList.add("location-actions-highlight");

    const timeoutId = window.setTimeout(() => {
      targetElement.classList.remove("location-actions-highlight");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
      targetElement.classList.remove("location-actions-highlight");
    };
  }, [focusMemberId, focusRequestKey]);

  const updateDraftCoordinate = (nextLat: string, nextLng: string) => {
    const lat = Number(nextLat);
    const lng = Number(nextLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setPickedCoordinate(null);
      return;
    }

    setPickedCoordinate({ lat, lng });
  };

  const handleAddMember = () => {
    if (!onAddMember) {
      return;
    }

    const parsed = displayNameSchema.safeParse(pendingName.trim());

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nama anggota belum valid.");
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
    let location: MemberLocation;

    try {
      location = createValidatedMemberLocation({
        accuracyM: locationInput.accuracyM,
        lat: locationInput.lat,
        lng: locationInput.lng,
        privacyMode,
        source: locationInput.source,
      });
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : "Lokasi belum valid.",
      );
      return false;
    }

    setError(null);
    await onUpdateMemberLocation(memberId, location);
    return true;
  };

  const handleCurrentLocation = (memberId: string) => {
    if (!navigator.geolocation) {
      setError("Browser ini tidak bisa mengambil lokasi otomatis. Coba isi manual.");
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
        setError("Lokasi belum berhasil diambil. Coba isi manual.");
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
    setPickedCoordinate(
      member.location
        ? {
            lat: member.location.lat,
            lng: member.location.lng,
          }
        : null,
    );
    setError(null);
  };

  const handleManualSave = async (memberId: string) => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Lintang dan bujur harus berupa angka.");
      return;
    }

    const success = await saveLocation(memberId, {
      lat,
      lng,
      source: "pinned",
    });

    if (success) {
      setEditingMemberId(null);
      setPickedCoordinate(null);
    }
  };

  return (
    <article className="rounded-3xl border border-line bg-surface p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-primary">Anggota room</h2>
          <p className="mt-2 text-sm leading-7 text-foreground">
            {privacyMode} · {privacyRule.locationPrecisionDecimals} digit presisi lokasi
          </p>
        </div>
      </div>

      {!isLiveMode || canAddMembers ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Tambah anggota
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
              placeholder="Tulis nama anggota"
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="button"
            onClick={handleAddMember}
            className="inline-flex items-center justify-center gap-2 self-end rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-7 text-foreground">
          Setiap orang memperbarui lokasinya dari device masing-masing.
        </p>
      )}

      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {members.map((member) => {
          const locationLocked = member.id === "invite-slot";
          const canUpdateThisMember =
            !isLiveMode ||
            canManageAllLocations ||
            (currentMemberId !== null && member.id === currentMemberId);
          const canUseCurrentLocation =
            !isLiveMode ||
            (currentMemberId !== null && member.id === currentMemberId);

          return (
            <div
              key={member.id}
              data-testid={`member-card-${member.id}`}
              className="rounded-2xl border border-line bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {member.displayName}
                    </p>
                    <span className="rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {member.role}
                    </span>
                    {currentMemberId === member.id ? (
                      <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                        kamu
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{member.statusLabel}</p>
                  {member.location ? (
                    <p className="mt-2 font-mono text-[11px] text-foreground">
                      {member.location.lat.toFixed(privacyRule.locationPrecisionDecimals)},{" "}
                      {member.location.lng.toFixed(privacyRule.locationPrecisionDecimals)} ·{" "}
                      {member.location.source}
                      {member.location.accuracyM
                        ? ` · ±${Math.round(member.location.accuracyM)}m`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-foreground">Lokasi belum dibagikan</p>
                  )}
                </div>

                {!isLiveMode ? (
                  <button
                    type="button"
                    onClick={() => onRemoveMember?.(member.id)}
                    disabled={member.role === "host"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${member.displayName}`}
                    title={
                      member.role === "host"
                        ? "Host tetap ada di room"
                        : `Remove ${member.displayName}`
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div
                id={`member-location-actions-${member.id}`}
                className="mt-4 flex flex-wrap gap-2 rounded-2xl p-2 transition"
              >
                <button
                  type="button"
                  onClick={() => handleCurrentLocation(member.id)}
                  data-testid={`member-use-current-location-${member.id}`}
                  disabled={
                    loadingMemberId === member.id ||
                    locationLocked ||
                    !canUseCurrentLocation
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingMemberId === member.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  Gunakan lokasi saat ini
                </button>
                <button
                  type="button"
                  onClick={() => startManualEdit(member)}
                  data-testid={`member-enter-coordinates-${member.id}`}
                  disabled={locationLocked || !canUpdateThisMember}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  Isi koordinat
                </button>
                <button
                  type="button"
                  onClick={() => startManualEdit(member)}
                  data-testid={`member-pin-on-map-${member.id}`}
                  disabled={locationLocked || !canUpdateThisMember}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Map className="h-3.5 w-3.5" />
                  Pilih di peta
                </button>
              </div>

              {locationLocked ? (
                <p className="mt-3 text-xs text-foreground">
                  Slot ini akan aktif setelah ada orang yang benar-benar join ke room.
                </p>
              ) : null}

              {isLiveMode && !canUpdateThisMember ? (
                <p className="mt-3 text-xs text-foreground">
                  Hanya host atau anggota yang bersangkutan yang bisa mengubah lokasi ini.
                </p>
              ) : null}

              {isLiveMode && canManageAllLocations && currentMemberId !== member.id ? (
                <p className="mt-3 text-xs text-foreground">
                  Untuk anggota ini, host bisa isi koordinat manual atau pilih titik di peta.
                </p>
              ) : null}

              {editingMemberId === member.id ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-line bg-surface p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      data-testid={`member-latitude-${member.id}`}
                      value={manualLat}
                      onChange={(event) => {
                        const nextLat = event.target.value;
                        setManualLat(nextLat);
                        updateDraftCoordinate(nextLat, manualLng);
                      }}
                      placeholder="Lintang"
                      className="rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      data-testid={`member-longitude-${member.id}`}
                      value={manualLng}
                      onChange={(event) => {
                        const nextLng = event.target.value;
                        setManualLng(nextLng);
                        updateDraftCoordinate(manualLat, nextLng);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleManualSave(member.id);
                        }
                      }}
                      placeholder="Bujur"
                      className="rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <LocationPickerMap
                    initialCenter={pickedCoordinate}
                    onPick={(coordinate) => {
                      setManualLat(String(coordinate.lat));
                      setManualLng(String(coordinate.lng));
                      setPickedCoordinate(coordinate);
                      setError(null);
                    }}
                    selectedCoordinate={pickedCoordinate}
                    testId={`location-picker-map-${member.id}`}
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleManualSave(member.id)}
                      data-testid={`member-save-location-${member.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                    >
                      <Check className="h-4 w-4" />
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(null);
                        setPickedCoordinate(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
