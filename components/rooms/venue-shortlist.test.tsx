import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VenueShortlist } from "@/components/rooms/venue-shortlist";
import type { RankedVenue } from "@/lib/rooms";

const VENUE: RankedVenue = {
  venueId: "venue-1",
  providerId: "provider-1",
  name: "Kopi Tengah",
  category: "cafe",
  address: "Jl. Sudirman",
  rating: 4.6,
  priceLevel: 2,
  openNow: true,
  distanceToCenterM: 180,
  tags: ["wifi", "cozy"],
  matchedTags: ["wifi"],
  score: 86.5,
  lat: -6.2,
  lng: 106.8,
  mapUrl: "https://maps.example.com/venue-1",
};

describe("VenueShortlist", () => {
  it("renders the empty midpoint state before venue retrieval starts", () => {
    render(
      <VenueShortlist
        venues={[]}
        activeCategories={[]}
        onToggleCategory={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        categories={["cafe", "restaurant"]}
        hasMidpoint={false}
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText(/venue retrieval starts after at least two members/i),
    ).toBeInTheDocument();
  });

  it("renders the no-match state when filters remove every venue", () => {
    render(
      <VenueShortlist
        venues={[VENUE]}
        activeCategories={["restaurant"]}
        onToggleCategory={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        categories={["cafe", "restaurant"]}
        hasMidpoint
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText(/no venues matched the current category filters/i),
    ).toBeInTheDocument();
  });

  it("renders provider errors inline", () => {
    render(
      <VenueShortlist
        venues={[]}
        activeCategories={[]}
        onToggleCategory={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage="Venue provider request failed."
        categories={["cafe"]}
        hasMidpoint
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText("Venue provider request failed."),
    ).toBeInTheDocument();
  });
});
