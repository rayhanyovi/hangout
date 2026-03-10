"use client";

import { ExternalLink, Loader2, MapPin, SlidersHorizontal, Star } from "lucide-react";
import { type VenueCategory } from "@/lib/contracts";
import {
  filterRankedVenues,
  type RankedVenue,
} from "@/lib/rooms";

type VenueShortlistProps = {
  venues: RankedVenue[];
  activeCategories: VenueCategory[];
  onToggleCategory: (category: VenueCategory) => void;
  onSelectVenue: (venueId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  categories: VenueCategory[];
  hasMidpoint: boolean;
  selectedVenueId: string | null;
};

const CATEGORY_LABELS: Record<VenueCategory, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  park: "Park",
  mall: "Mall",
  other: "Other",
};

export function VenueShortlist({
  venues,
  activeCategories,
  onToggleCategory,
  onSelectVenue,
  isLoading,
  errorMessage,
  categories,
  hasMidpoint,
  selectedVenueId,
}: VenueShortlistProps) {
  const filteredVenues = filterRankedVenues(venues, activeCategories);

  return (
    <article className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Venue shortlist
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Venue candidates are now retrieved from the server search boundary
            and ranked by distance, category fit, and matched tags.
          </p>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </div>
        {categories.map((category) => {
          const active =
            activeCategories.length === 0 || activeCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => onToggleCategory(category)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                active
                  ? "border-coral bg-coral/12 text-coral"
                  : "border-line bg-white/80 text-muted"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-[1.2rem] border border-coral/30 bg-coral/8 px-4 py-3 text-sm text-coral">
          {errorMessage}
        </p>
      ) : null}

      {!hasMidpoint ? (
        <p className="mt-5 text-sm leading-7 text-muted">
          Venue retrieval starts after at least two members have shared a
          location and the midpoint is available.
        </p>
      ) : null}

      {hasMidpoint && !isLoading && filteredVenues.length === 0 && !errorMessage ? (
        <p className="mt-5 text-sm leading-7 text-muted">
          No venues matched the current category filters for this room.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredVenues.map((venue) => (
          <div
            key={venue.venueId}
            className={`rounded-[1.3rem] border p-4 transition ${
              selectedVenueId === venue.venueId
                ? "border-foreground bg-white shadow-[0_14px_34px_rgba(31,27,23,0.12)]"
                : "border-line bg-white/80"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => onSelectVenue(venue.venueId)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {venue.name}
                  </p>
                  <span className="rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {CATEGORY_LABELS[venue.category]}
                  </span>
                  {selectedVenueId === venue.venueId ? (
                    <span className="rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-background">
                      focused
                    </span>
                  ) : null}
                </div>
                {venue.address ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{venue.address}</span>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-foreground">
                    {venue.distanceToCenterM} m from midpoint
                  </span>
                  <span className="rounded-full bg-teal/12 px-3 py-1 text-[11px] font-semibold text-teal">
                    Match score {venue.score.toFixed(1)}
                  </span>
                  {venue.rating ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sun/25 px-3 py-1 text-[11px] font-semibold text-foreground">
                      <Star className="h-3 w-3" />
                      {venue.rating}
                    </span>
                  ) : null}
                </div>
                {venue.matchedTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {venue.matchedTags.map((tag) => (
                      <span
                        key={`${venue.venueId}-${tag}`}
                        className="rounded-full border border-line bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>

              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:-translate-y-0.5 hover:text-foreground"
                aria-label={`Open ${venue.name} in maps`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
