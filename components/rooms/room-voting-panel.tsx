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
    <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Voting
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Member vote selalu mengarah ke venue yang sedang dipilih dari
            shortlist. Host bisa finalize setelah kandidat pemenang jelas.
          </p>
        </div>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Total votes
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{votes.length}</p>
        </div>
        <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Your vote
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {currentVote
              ? venues.find((venue) => venue.venueId === currentVote.venueId)?.name ??
                currentVote.venueId
              : "Not voted yet"}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-line bg-white/78 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Finalized
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {finalizedVenueId
              ? venues.find((venue) => venue.venueId === finalizedVenueId)?.name ??
                finalizedVenueId
              : "Not finalized"}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-[1.2rem] border border-coral/30 bg-coral/8 px-4 py-3 text-sm text-coral">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 rounded-[1.4rem] border border-line bg-white/80 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Selected venue
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {selectedVenue?.name ?? "Pick a venue from the shortlist first"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectedVenueId && onVote(selectedVenueId)}
            disabled={!currentMemberId || !selectedVenueId || isSubmitting || finalizedVenueId !== null}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Vote className="h-4 w-4" />
            Vote for selected venue
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
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Crown className="h-4 w-4" />
            Host finalize
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
              className={`rounded-[1.3rem] border p-4 ${
                isFinalized ? "border-foreground bg-white" : "border-line bg-white/80"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{venue.name}</p>
                  <p className="mt-1 text-xs text-muted">{venueVotes} vote(s)</p>
                </div>
                <div className="flex gap-2">
                  {isCurrentVote ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
                      <CheckCircle2 className="h-3 w-3" />
                      your vote
                    </span>
                  ) : null}
                  {isFinalized ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-background">
                      <Crown className="h-3 w-3" />
                      finalized
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
