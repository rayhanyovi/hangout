"use client";

import type { MemberLocation, PrivacyMode } from "@/lib/contracts";
import type { DraftRoomMember } from "@/lib/rooms";
import { RoomMemberManager } from "@/components/rooms/room-member-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle>Anggota room</DialogTitle>
          <DialogDescription>
            Kelola anggota dan perbarui lokasi dari satu tempat.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
