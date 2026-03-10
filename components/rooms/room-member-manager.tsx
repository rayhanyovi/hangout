"use client";

import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { joinRoomSchema } from "@/lib/validation";
import type { DraftRoomMember } from "@/lib/rooms";

type RoomMemberManagerProps = {
  inviteLink: string;
  members: DraftRoomMember[];
  onAddMember: (displayName: string) => void;
  onRemoveMember: (memberId: string) => void;
};

const displayNameSchema = joinRoomSchema.shape.displayName;

export function RoomMemberManager({
  inviteLink,
  members,
  onAddMember,
  onRemoveMember,
}: RoomMemberManagerProps) {
  const [pendingName, setPendingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sharedCount = members.filter((member) => member.location !== null).length;
  const pendingCount = members.length - sharedCount;

  const handleAddMember = () => {
    const parsed = displayNameSchema.safeParse(pendingName.trim());

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Member name is not valid.");
      return;
    }

    setError(null);
    onAddMember(parsed.data);
    setPendingName("");
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

      <div className="mt-5 rounded-[1.4rem] border border-dashed border-line bg-white/80 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Invite route
        </p>
        <p className="mt-2 break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-foreground">
          {inviteLink}
        </p>
      </div>

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

      {error ? <p className="mt-3 text-sm font-medium text-coral">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {members.map((member) => (
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
                </div>
                <p className="mt-2 text-sm text-ink-soft">{member.statusLabel}</p>
                {member.location ? (
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {member.location.lat.toFixed(4)}, {member.location.lng.toFixed(4)} ·{" "}
                    {member.location.source}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">Location pending</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemoveMember(member.id)}
                disabled={member.role === "host"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove ${member.displayName}`}
                title={member.role === "host" ? "Host stays in the room" : `Remove ${member.displayName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
