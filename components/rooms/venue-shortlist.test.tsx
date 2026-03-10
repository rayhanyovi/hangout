import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        onSelectRadius={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        categories={["cafe", "restaurant"]}
        radiusM={2000}
        radiusOptions={[500, 1000, 2000]}
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
        onSelectRadius={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        categories={["cafe", "restaurant"]}
        radiusM={2000}
        radiusOptions={[500, 1000, 2000]}
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
        onSelectRadius={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage="Venue provider request failed."
        categories={["cafe"]}
        radiusM={2000}
        radiusOptions={[500, 1000, 2000]}
        hasMidpoint
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText("Venue provider request failed."),
    ).toBeInTheDocument();
  });

  it("lets the room shell update live search controls", async () => {
    const user = userEvent.setup();
    const onToggleCategory = vi.fn();
    const onSelectRadius = vi.fn();

    render(
      <VenueShortlist
        venues={[VENUE]}
        activeCategories={["cafe"]}
        onToggleCategory={onToggleCategory}
        onSelectRadius={onSelectRadius}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        categories={["cafe", "restaurant"]}
        radiusM={2000}
        radiusOptions={[500, 1000, 2000]}
        hasMidpoint
        selectedVenueId={VENUE.venueId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Restaurant" }));
    await user.click(screen.getByRole("button", { name: "1 km" }));

    expect(onToggleCategory).toHaveBeenCalledWith("restaurant");
    expect(onSelectRadius).toHaveBeenCalledWith(1000);
  });
});
