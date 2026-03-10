"use client";

import {
  CheckCircle2,
  Crown,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  Vote,
} from "lucide-react";
import { type VenueCategory, type Vote as RoomVote } from "@/lib/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SelectBox, type SelectOption } from "@/components/ui/select";
import {
  filterRankedVenues,
  type RankedVenue,
} from "@/lib/rooms";

type VenueShortlistProps = {
  venues: RankedVenue[];
  activeCategories: VenueCategory[];
  selectedCategory: string;
  selectedRadius: string;
  categoryOptions: SelectOption[];
  radiusOptions: SelectOption[];
  onCategoryChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
  onSelectVenue: (venueId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  hasMidpoint: boolean;
  selectedVenueId: string | null;
  votes?: RoomVote[];
  currentMemberId?: string | null;
  hostMemberId?: string | null;
  finalizedVenueId?: string | null;
  isSubmittingVote?: boolean;
  voteError?: string | null;
  onVote?: (venueId: string) => void;
  onFinalize?: (venueId: string) => void;
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
  selectedCategory,
  selectedRadius,
  categoryOptions,
  radiusOptions,
  onCategoryChange,
  onRadiusChange,
  onSelectVenue,
  isLoading,
  errorMessage,
  hasMidpoint,
  selectedVenueId,
  votes = [],
  currentMemberId = null,
  hostMemberId = null,
  finalizedVenueId = null,
  isSubmittingVote = false,
  voteError = null,
  onVote,
  onFinalize,
}: VenueShortlistProps) {
  const filteredVenues = filterRankedVenues(venues, activeCategories);
  const currentVote =
    currentMemberId !== null
      ? votes.find((vote) => vote.memberId === currentMemberId)
      : undefined;

  return (
    <Card className="h-full bg-surface">
      <CardHeader className="pb-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Venue shortlist
          </p>
          <p className="mt-2 text-sm leading-7 text-foreground">
            Pilihan tempat diurutkan berdasarkan jarak dari titik temu dan
            kecocokannya dengan kategori yang kamu pilih.
          </p>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>
      </CardHeader>
      <CardContent className="pt-5">

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Kategori
          </p>
          <SelectBox
            ariaLabel="Filter kategori venue"
            value={selectedCategory}
            options={categoryOptions}
            onValueChange={onCategoryChange}
          />
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Radius
          </p>
          <SelectBox
            ariaLabel="Filter radius venue"
            value={selectedRadius}
            options={radiusOptions}
            onValueChange={onRadiusChange}
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {voteError ? (
        <p className="mt-4 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {voteError}
        </p>
      ) : null}

      {!hasMidpoint ? (
        <p className="mt-5 text-sm leading-7 text-foreground">
          Setelah minimal dua orang membagikan lokasi, rekomendasi tempat akan
          muncul otomatis di sini.
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
          Belum ada tempat yang cocok dengan filter yang dipilih.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredVenues.map((venue) => (
          <div
            key={venue.venueId}
            data-testid={`venue-card-${venue.venueId}`}
            className={`rounded-2xl border p-4 transition shadow-none ${
              selectedVenueId === venue.venueId
                ? "border-primary bg-card shadow-lg"
                : "border-line bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectVenue(venue.venueId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectVenue(venue.venueId);
                  }
                }}
                className="min-w-0 flex-1 cursor-pointer text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-primary">
                    {venue.name}
                  </p>
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[venue.category]}
                  </Badge>
                  {selectedVenueId === venue.venueId ? (
                    <Badge>
                      dipilih
                    </Badge>
                  ) : null}
                </div>
                {venue.address ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{venue.address}</span>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-surface px-3 py-1 text-[11px] normal-case tracking-normal">
                    {venue.distanceToCenterM} m dari titik temu
                  </Badge>
                  <Badge variant="success" className="px-3 py-1 text-[11px] normal-case tracking-normal">
                    Skor cocok {venue.score.toFixed(1)}
                  </Badge>
                  {venue.rating ? (
                    <Badge variant="outline" className="gap-1 bg-accent-soft px-3 py-1 text-[11px] normal-case tracking-normal text-accent-foreground">
                      <Star className="h-3 w-3" />
                      {venue.rating}
                    </Badge>
                  ) : null}
                </div>
                {venue.matchedTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {venue.matchedTags.map((tag) => (
                      <Badge
                        key={`${venue.venueId}-${tag}`}
                        variant="secondary"
                        className="tracking-[0.12em]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onVote?.(venue.venueId);
                    }}
                    disabled={
                      !currentMemberId ||
                      isSubmittingVote ||
                      finalizedVenueId !== null ||
                      !onVote
                    }
                    size="sm"
                  >
                    <Vote className="h-3.5 w-3.5" />
                    {currentVote?.venueId === venue.venueId ? "Sudah kamu vote" : "Vote"}
                  </Button>
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFinalize?.(venue.venueId);
                    }}
                    disabled={
                      currentMemberId !== hostMemberId ||
                      isSubmittingVote ||
                      finalizedVenueId !== null ||
                      !onFinalize
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Kunci pilihan
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {currentVote?.venueId === venue.venueId ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    pilihanmu
                  </Badge>
                ) : null}
                {finalizedVenueId === venue.venueId ? (
                  <Badge className="gap-1">
                    <Crown className="h-3 w-3" />
                    terpilih
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-surface">
                    {votes.filter((vote) => vote.venueId === venue.venueId).length} suara
                  </Badge>
                )}
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground"
                  aria-label={`Open ${venue.name} in maps`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      </CardContent>
    </Card>
  );
}
