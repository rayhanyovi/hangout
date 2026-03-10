"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RoomStatusBanner } from "@/components/rooms/room-status-banner";
import { getRoomRoute, type CreateRoomOutput } from "@/lib/contracts";
import { createRoomSchema } from "@/lib/validation";

const CREATE_ROOM_TIMEOUT_MS = 10000;

const DEFAULT_ROOM_SETUP = {
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

      startTransition(() => {
        router.push(
          `${getRoomRoute(output.room.joinCode)}?member=${output.hostMember.memberId}`,
        );
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
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-3xl border border-line bg-card p-6 shadow-xl"
    >
      <div className="space-y-2">
        <label
          htmlFor="room-title"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
        >
          Room title
        </label>
        <input
          id="room-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Friday catch-up"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="host-name"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
        >
          Host name
        </label>
        <input
          id="host-name"
          value={hostDisplayName}
          onChange={(event) => setHostDisplayName(event.target.value)}
          placeholder="Yovi"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm leading-6 text-muted-foreground">
        Room akan dibuat dulu dengan setup default. Transport mode, radius,
        kategori venue, budget, dan preferensi lanjutan bisa diatur dari room
        setelah host masuk.
      </div>

      {requestState === "loading" ? (
        <RoomStatusBanner
          tone="info"
          title="Creating the room."
          description="Nama acara dan host sedang dikirim ke room API supaya join code dan host session bisa dibuat."
        />
      ) : null}

      {requestState === "timeout" ? (
        <RoomStatusBanner
          tone="warning"
          title="Room creation is taking longer than expected."
          description="Coba kirim ulang setup host ini. Jika masalah berulang, cek server room API atau environment lokal."
        />
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Cukup isi nama acara dan nama host untuk buka room baru.
        </p>
        <button
          type="submit"
          disabled={isPending || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending || isSubmitting ? "Opening room..." : "Create room"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
