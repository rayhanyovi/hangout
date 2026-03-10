"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRoomRoute, type CreateRoomOutput } from "@/lib/contracts";
import { persistRoomMemberCookie } from "@/lib/rooms";
import { createRoomSchema } from "@/lib/validation";

const CREATE_ROOM_TIMEOUT_MS = 10000;

const DEFAULT_ROOM_SETUP = {
  description: null,
  scheduledLabel: null,
  transportMode: "motor" as const,
  privacyMode: "approximate" as const,
  venuePreferences: {
    categories: ["cafe", "restaurant"] as const,
    tags: [] as string[],
    budget: "mid" as const,
    radiusMDefault: 2000,
  },
};

export function CreateRoomForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hostDisplayName, setHostDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "timeout">(
    "idle",
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createRoomSchema.safeParse({
      title: title.trim() ? title.trim() : null,
      hostDisplayName,
      ...DEFAULT_ROOM_SETUP,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Form room belum valid.");
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
    }, CREATE_ROOM_TIMEOUT_MS);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as
        | CreateRoomOutput
        | {
            message?: string;
          };

      if (!response.ok) {
        const errorPayload = payload as { message?: string };
        throw new Error(errorPayload.message ?? "Room creation failed.");
      }
      const output = payload as CreateRoomOutput;
      persistRoomMemberCookie(output.room.joinCode, output.hostMember.memberId);

      startTransition(() => {
        router.push(getRoomRoute(output.room.joinCode));
      });
    } catch (submitError) {
      setError(
        didTimeout
          ? "Room creation timed out before the room was ready."
          : submitError instanceof Error
            ? submitError.message
            : "Room creation failed.",
      );
      setRequestState(didTimeout ? "timeout" : "idle");
      setIsSubmitting(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardContent className="grid gap-6 p-6">
        <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="space-y-2">
        <label
          htmlFor="room-title"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-primary"
        >
          Nama acara
        </label>
        <Input
          id="room-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Friday catch-up"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="host-name"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-primary"
        >
          Nama kamu
        </label>
        <Input
          id="host-name"
          value={hostDisplayName}
          onChange={(event) => setHostDisplayName(event.target.value)}
          placeholder="Yovi"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm leading-6 text-muted-foreground">
        Room akan dibuat dengan pengaturan awal yang aman. Nanti kamu masih
        bisa atur radius, kategori tempat, dan preferensi lain dari dalam room.
      </div>

      {requestState === "loading" ? (
        <RoomStatusBanner
          tone="info"
            title="Sedang membuat room."
            description="Tunggu sebentar, room kamu lagi disiapkan."
        />
      ) : null}

      {requestState === "timeout" ? (
        <RoomStatusBanner
          tone="warning"
            title="Pembuatan room lebih lama dari biasanya."
            description="Coba kirim ulang beberapa saat lagi."
        />
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Isi dua kolom ini untuk mulai bikin room.
        </p>
        <Button
          type="submit"
          disabled={isPending || isSubmitting}
        >
          {isPending || isSubmitting ? "Membuka room..." : "Buat room"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
        </form>
      </CardContent>
    </Card>
  );
}
