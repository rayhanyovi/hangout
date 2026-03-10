"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRoomRoute, type JoinRoomOutput } from "@/lib/contracts";
import { persistRoomMemberCookie } from "@/lib/rooms";
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
      persistRoomMemberCookie(output.room.joinCode, output.member.memberId);

      startTransition(() => {
        router.push(getRoomRoute(output.room.joinCode));
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
    <Card className="shadow-lg">
      <CardContent className="p-5">
      <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search className="h-4 w-4" />
        {compact ? "Masuk ke room ini" : "Masuk ke room"}
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground">
        {compact
          ? "Masuk sebagai anggota lalu bagikan lokasi dari device kamu sendiri."
          : "Punya kode room? Masuk untuk lihat titik temu, shortlist tempat, dan voting bareng."}
      </p>

      <div
        className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}
      >
        {!compact ? (
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Kode room
            </span>
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABCD12"
              className="font-semibold tracking-[0.2em]"
            />
          </label>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Nama
          </span>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nama kamu"
          />
        </label>
        <Button
          type="submit"
          disabled={isPending || isSubmitting}
          aria-label={isPending || isSubmitting ? "Membuka room" : "Masuk ke room"}
          data-testid="join-room-submit"
          className="rounded-2xl"
        >
          {isPending || isSubmitting ? "Membuka..." : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {compact ? (
        <p className="mt-3 text-xs text-foreground">
          Kode room <span className="font-mono text-foreground">{initialJoinCode}</span> akan dipakai otomatis.
        </p>
      ) : (
        <p className="mt-3 text-xs text-foreground">
          Setelah masuk, kamu akan langsung dibawa ke room yang sama dengan teman-temanmu.
        </p>
      )}

      {requestState === "loading" ? (
        <div className="mt-4">
          <RoomStatusBanner
            tone="info"
            title="Sedang masuk ke room."
            description="Tunggu sebentar, room sedang disiapkan untuk kamu."
          />
        </div>
      ) : null}

      {requestState === "timeout" ? (
        <div className="mt-4">
          <RoomStatusBanner
            tone="warning"
            title="Masuk ke room lebih lama dari biasanya."
            description="Coba ulangi lagi sebentar."
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
      ) : null}
      </form>
      </CardContent>
    </Card>
  );
}
