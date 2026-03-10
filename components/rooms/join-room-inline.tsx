"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { getRoomRoute } from "@/lib/contracts";
import { joinRoomSchema } from "@/lib/validation";
import { serializeDraftRoomSearchParams } from "@/lib/rooms";

export function JoinRoomInline() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    const query = serializeDraftRoomSearchParams({
      title: null,
      hostDisplayName: "Host",
      guestDisplayName: parsed.data.displayName,
      transportMode: "motor",
      privacyMode: "approximate",
      categories: [],
      tags: [],
      radiusMDefault: 2000,
      previewMode: true,
    });

    startTransition(() => {
      router.push(`${getRoomRoute(parsed.data.joinCode)}?${query.toString()}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.8rem] border border-line bg-white/72 p-5 shadow-[0_18px_45px_rgba(31,27,23,0.08)]"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search className="h-4 w-4" />
        Join existing room
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Punya room code? Masuk langsung ke shell room untuk lanjut lihat alur
        koordinasinya.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Join code
          </span>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="ABCD12"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold tracking-[0.2em] text-foreground outline-none transition focus:border-coral"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Nama
          </span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nama kamu"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Opening..." : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Saat ini join flow masih membuka shell room preview sampai persistence
        backend aktif.
      </p>

      {error ? (
        <p className="mt-3 text-sm font-medium text-coral">{error}</p>
      ) : null}
    </form>
  );
}
