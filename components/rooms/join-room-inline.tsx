"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { getRoomRoute, type JoinRoomOutput } from "@/lib/contracts";
import { joinRoomSchema } from "@/lib/validation";

type JoinRoomInlineProps = {
  initialJoinCode?: string;
  compact?: boolean;
};

const JOIN_ROOM_TIMEOUT_MS = 10000;

export function JoinRoomInline({
  initialJoinCode = "",
  compact = false,
}: JoinRoomInlineProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "timeout">(
    "idle",
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = joinRoomSchema.safeParse({
      joinCode: joinCode.trim().toUpperCase(),
      displayName,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Join code tidak valid.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setRequestState("loading");

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, JOIN_ROOM_TIMEOUT_MS);

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as
        | JoinRoomOutput
        | {
            message?: string;
          };

      if (!response.ok) {
        const errorPayload = payload as { message?: string };
        throw new Error(errorPayload.message ?? "Join request failed.");
      }
      const output = payload as JoinRoomOutput;

      startTransition(() => {
        router.push(
          `${getRoomRoute(output.room.joinCode)}?member=${output.member.memberId}`,
        );
      });
    } catch (submitError) {
      setError(
        didTimeout
          ? "Join request timed out before the room could be opened."
          : submitError instanceof Error
            ? submitError.message
            : "Join request failed.",
      );
      setRequestState(didTimeout ? "timeout" : "idle");
      setIsSubmitting(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-line bg-card p-5 shadow-lg"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search className="h-4 w-4" />
        {compact ? "Join this room" : "Join existing room"}
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground">
        {compact
          ? "Masuk sebagai member untuk share lokasi dari device kamu sendiri."
          : "Punya room code? Masuk langsung ke room yang sama untuk lanjut koordinasi."}
      </p>

      <div
        className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}
      >
        {!compact ? (
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Join code
            </span>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABCD12"
              className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm font-semibold tracking-[0.2em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Nama
          </span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nama kamu"
            className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          disabled={isPending || isSubmitting}
          aria-label={isPending || isSubmitting ? "Opening room" : "Join room"}
          data-testid="join-room-submit"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending || isSubmitting ? "Opening..." : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      {compact ? (
        <p className="mt-3 text-xs text-foreground">
          Join code <span className="font-mono text-foreground">{initialJoinCode}</span> akan dipakai otomatis.
        </p>
      ) : (
        <p className="mt-3 text-xs text-foreground">
          Join flow sekarang memakai room API nyata dan langsung masuk ke room yang sama.
        </p>
      )}

      {requestState === "loading" ? (
        <div className="mt-4">
          <RoomStatusBanner
            tone="info"
            title="Joining the room."
            description="Identity member sedang dibuat dan snapshot room akan dibuka setelah request selesai."
          />
        </div>
      ) : null}

      {requestState === "timeout" ? (
        <div className="mt-4">
          <RoomStatusBanner
            tone="warning"
            title="Join flow is taking longer than expected."
            description="Ulangi join request ini. Jika tetap timeout, cek room API atau status persistence lokal."
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
      ) : null}
    </form>
  );
}
