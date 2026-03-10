"use client";

import { X } from "lucide-react";
import type { MemberLocation, PrivacyMode } from "@/lib/contracts";
import type { DraftRoomMember } from "@/lib/rooms";
import { RoomMemberManager } from "@/components/rooms/room-member-manager";

type RoomMembersModalProps = {
  open: boolean;
  members: DraftRoomMember[];
  privacyMode: PrivacyMode;
  mode: "preview" | "live";
  currentMemberId?: string | null;
  focusMemberId?: string | null;
  focusRequestKey?: number;
  canAddMembers?: boolean;
  canManageAllLocations?: boolean;
  onClose: () => void;
  onAddMember?: (displayName: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberLocation: (
    memberId: string,
    location: MemberLocation,
  ) => void | Promise<void>;
};

export function RoomMembersModal({
  open,
  members,
  privacyMode,
  mode,
  currentMemberId = null,
  focusMemberId = null,
  focusRequestKey = 0,
  canAddMembers = false,
  canManageAllLocations = false,
  onClose,
  onAddMember,
  onRemoveMember,
  onUpdateMemberLocation,
}: RoomMembersModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1200] isolate flex items-start justify-center bg-black/50 px-4 py-6 backdrop-blur-sm md:items-center">
      <div className="relative z-[1201] max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-line bg-surface p-4 shadow-2xl md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary">
              Anggota room
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground">
              Kelola anggota dan perbarui lokasi dari satu tempat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-foreground transition hover:-translate-y-0.5"
            aria-label="Tutup anggota room"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <RoomMemberManager
          members={members}
          privacyMode={privacyMode}
          mode={mode}
          currentMemberId={currentMemberId}
          focusMemberId={focusMemberId}
          focusRequestKey={focusRequestKey}
          canAddMembers={canAddMembers}
          canManageAllLocations={canManageAllLocations}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
          onUpdateMemberLocation={onUpdateMemberLocation}
        />
      </div>
    </div>
  );
}
