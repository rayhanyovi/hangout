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
  onSelectRadius: (radiusM: number) => void;
  onSelectVenue: (venueId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  categories: VenueCategory[];
  radiusM: number;
  radiusOptions: number[];
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
  onSelectRadius,
  onSelectVenue,
  isLoading,
  errorMessage,
  categories,
  radiusM,
  radiusOptions,
  hasMidpoint,
  selectedVenueId,
}: VenueShortlistProps) {
  const filteredVenues = filterRankedVenues(venues, activeCategories);

  return (
    <article className="rounded-3xl border border-line bg-surface p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Venue shortlist
          </p>
          <p className="mt-2 text-sm leading-7 text-foreground">
            Venue candidates are now retrieved from the server search boundary
            and ranked by distance, category fit, and matched tags. Radius and
            category controls below now refresh the live shortlist.
          </p>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
      </div>

      <div className="mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Search radius
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {radiusOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelectRadius(option)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                radiusM === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-card text-muted-foreground"
              }`}
            >
              {option >= 1000 ? `${option / 1000} km` : `${option} m`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Live categories
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
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-card text-muted-foreground"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {!hasMidpoint ? (
        <p className="mt-5 text-sm leading-7 text-foreground">
          Venue retrieval starts after at least two members have shared a
          location and the midpoint is available.
        </p>
      ) : null}

      {hasMidpoint && activeCategories.length === 0 ? (
        <p className="mt-5 text-sm leading-7 text-foreground">
          Tidak ada kategori spesifik yang dipilih, jadi shortlist sekarang
          mencari semua kategori venue yang tersedia.
        </p>
      ) : null}

      {hasMidpoint && !isLoading && filteredVenues.length === 0 && !errorMessage ? (
        <p className="mt-5 text-sm leading-7 text-foreground">
          No venues matched the current category filters for this room.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredVenues.map((venue) => (
          <div
            key={venue.venueId}
            data-testid={`venue-card-${venue.venueId}`}
            className={`rounded-2xl border p-4 transition ${
              selectedVenueId === venue.venueId
                ? "border-primary bg-card shadow-lg"
                : "border-line bg-card"
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
                    <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                      focused
                    </span>
                  ) : null}
                </div>
                {venue.address ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{venue.address}</span>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-foreground">
                    {venue.distanceToCenterM} m from midpoint
                  </span>
                  <span className="rounded-full bg-success-soft px-3 py-1 text-[11px] font-semibold text-success-foreground">
                    Match score {venue.score.toFixed(1)}
                  </span>
                  {venue.rating ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent-foreground">
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
                        className="rounded-full border border-line bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
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
