import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { VenueShortlist } from "@/components/rooms/venue-shortlist";
import type { RankedVenue } from "@/lib/rooms";
import type { SelectOption } from "@/components/ui/select";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: () => false,
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => undefined,
  });
});

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Semua kategori", value: "all" },
  { label: "Cafe", value: "cafe" },
  { label: "Restaurant", value: "restaurant" },
];

const RADIUS_OPTIONS: SelectOption[] = [
  { label: "500 m", value: "500" },
  { label: "1 km", value: "1000" },
  { label: "2 km", value: "2000" },
];

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
        selectedCategory="all"
        selectedRadius="2000"
        categoryOptions={CATEGORY_OPTIONS}
        radiusOptions={RADIUS_OPTIONS}
        onCategoryChange={vi.fn()}
        onRadiusChange={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        hasMidpoint={false}
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText(/setelah minimal dua orang membagikan lokasi/i),
    ).toBeInTheDocument();
  });

  it("renders the no-match state when filters remove every venue", () => {
    render(
      <VenueShortlist
        venues={[VENUE]}
        activeCategories={["restaurant"]}
        selectedCategory="restaurant"
        selectedRadius="2000"
        categoryOptions={CATEGORY_OPTIONS}
        radiusOptions={RADIUS_OPTIONS}
        onCategoryChange={vi.fn()}
        onRadiusChange={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        hasMidpoint
        selectedVenueId={null}
      />,
    );

    expect(
      screen.getByText(/belum ada tempat yang cocok dengan filter yang dipilih/i),
    ).toBeInTheDocument();
  });

  it("renders provider errors inline", () => {
    render(
      <VenueShortlist
        venues={[]}
        activeCategories={[]}
        selectedCategory="all"
        selectedRadius="2000"
        categoryOptions={CATEGORY_OPTIONS}
        radiusOptions={RADIUS_OPTIONS}
        onCategoryChange={vi.fn()}
        onRadiusChange={vi.fn()}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage="Venue provider request failed."
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
    const onCategoryChange = vi.fn();
    const onRadiusChange = vi.fn();

    render(
      <VenueShortlist
        venues={[VENUE]}
        activeCategories={["cafe"]}
        selectedCategory="cafe"
        selectedRadius="2000"
        categoryOptions={CATEGORY_OPTIONS}
        radiusOptions={RADIUS_OPTIONS}
        onCategoryChange={onCategoryChange}
        onRadiusChange={onRadiusChange}
        onSelectVenue={vi.fn()}
        isLoading={false}
        errorMessage={null}
        hasMidpoint
        selectedVenueId={VENUE.venueId}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Filter kategori venue" }),
    );
    await user.click(screen.getByText("Restaurant"));
    await user.click(
      screen.getByRole("combobox", { name: "Filter radius venue" }),
    );
    await user.click(screen.getByText("1 km"));

    expect(onCategoryChange).toHaveBeenCalledWith("restaurant");
    expect(onRadiusChange).toHaveBeenCalledWith("1000");
  });
});
