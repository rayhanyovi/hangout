"use client";

import { CheckCircle2, Crown, Loader2, Vote } from "lucide-react";
import type { Vote as RoomVote, Venue } from "@/lib/contracts";

type RoomVotingPanelProps = {
  venues: Venue[];
  votes: RoomVote[];
  selectedVenueId: string | null;
  currentMemberId: string | null;
  hostMemberId: string | null;
  finalizedVenueId: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onVote: (venueId: string) => void;
  onFinalize: (venueId: string) => void;
};

export function RoomVotingPanel({
  venues,
  votes,
  selectedVenueId,
  currentMemberId,
  hostMemberId,
  finalizedVenueId,
  isSubmitting,
  errorMessage,
  onVote,
  onFinalize,
}: RoomVotingPanelProps) {
  const currentVote =
    currentMemberId !== null
      ? votes.find((vote) => vote.memberId === currentMemberId)
      : undefined;
  const selectedVenue =
    selectedVenueId !== null
      ? venues.find((venue) => venue.venueId === selectedVenueId) ?? null
      : null;

  return (
    <article className="rounded-3xl border border-line bg-surface p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Voting
          </p>
          <p className="mt-2 text-sm leading-7 text-foreground">
            Pilih tempat favoritmu dari shortlist, lalu host bisa mengunci
            pilihan akhir setelah semua suara masuk.
          </p>
        </div>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Total suara
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{votes.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Pilihanmu
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {currentVote
              ? venues.find((venue) => venue.venueId === currentVote.venueId)?.name ??
                currentVote.venueId
              : "Belum memilih"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Hasil akhir
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {finalizedVenueId
              ? venues.find((venue) => venue.venueId === finalizedVenueId)?.name ??
                finalizedVenueId
              : "Belum dikunci"}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {venues.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <p className="text-sm font-semibold text-primary">
            Voting akan dibuka setelah ada pilihan tempat.
          </p>
          <p className="mt-2 text-sm leading-7 text-foreground">
            Tunggu rekomendasi tempat muncul dulu, atau minta lebih banyak
            anggota membagikan lokasi mereka.
          </p>
        </div>
      ) : null}

      {venues.length > 0 ? (
        <>
          <div className="mt-5 rounded-2xl border border-line bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              Tempat yang dipilih
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {selectedVenue?.name ?? "Pilih salah satu tempat dari daftar di atas"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectedVenueId && onVote(selectedVenueId)}
                disabled={!currentMemberId || !selectedVenueId || isSubmitting || finalizedVenueId !== null}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Vote className="h-4 w-4" />
                Vote tempat ini
              </button>
              <button
                type="button"
                onClick={() => selectedVenueId && onFinalize(selectedVenueId)}
                disabled={
                  currentMemberId !== hostMemberId ||
                  !selectedVenueId ||
                  isSubmitting ||
                  finalizedVenueId !== null
                }
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Crown className="h-4 w-4" />
                Kunci pilihan
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {venues.map((venue) => {
              const venueVotes = votes.filter((vote) => vote.venueId === venue.venueId).length;
              const isCurrentVote = currentVote?.venueId === venue.venueId;
              const isFinalized = finalizedVenueId === venue.venueId;

              return (
                <div
                  key={venue.venueId}
                  className={`rounded-2xl border p-4 ${
                    isFinalized ? "border-primary bg-card" : "border-line bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{venue.name}</p>
                      <p className="mt-1 text-xs text-foreground">{venueVotes} suara</p>
                    </div>
                    <div className="flex gap-2">
                      {isCurrentVote ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-success-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          pilihanmu
                        </span>
                      ) : null}
                      {isFinalized ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                          <Crown className="h-3 w-3" />
                          terpilih
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </article>
  );
}
