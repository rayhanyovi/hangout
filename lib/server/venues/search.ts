import type { BudgetLevel, Coordinate, VenueCategory } from "@/lib/contracts";
import { fetchOverpassVenues } from "@/lib/venues";
import { rankVenuesForRoom } from "@/lib/rooms";

type SearchRoomVenuesInput = {
  midpoint: Coordinate;
  radiusM: number;
  categories: VenueCategory[];
  tags: string[];
  budget?: BudgetLevel;
  limit?: number;
};

export async function searchRoomVenues({
  midpoint,
  radiusM,
  categories,
  tags,
  budget,
  limit = 8,
}: SearchRoomVenuesInput) {
  const venues = await fetchOverpassVenues(midpoint, radiusM, categories);

  return rankVenuesForRoom(
    venues,
    {
      categories,
      tags,
      budget,
      radiusMDefault: radiusM,
    },
    limit,
  );
}
