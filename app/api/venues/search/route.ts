import { NextRequest, NextResponse } from "next/server";
import { searchRoomVenues } from "@/lib/server/venues/search";
import { searchVenuesSchema } from "@/lib/validation";
import { VENUE_CATEGORIES, type VenueCategory } from "@/lib/contracts";

export const dynamic = "force-dynamic";

function parseCommaSeparatedList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categories = parseCommaSeparatedList(searchParams.get("categories")).filter(
    (category): category is VenueCategory =>
      VENUE_CATEGORIES.includes(category as VenueCategory),
  );
  const parsed = searchVenuesSchema.safeParse({
    midpoint: {
      lat: searchParams.get("lat") === null ? Number.NaN : Number(searchParams.get("lat")),
      lng: searchParams.get("lng") === null ? Number.NaN : Number(searchParams.get("lng")),
    },
    radiusM:
      searchParams.get("radiusM") === null
        ? Number.NaN
        : Number(searchParams.get("radiusM")),
    categories,
    tags: parseCommaSeparatedList(searchParams.get("tags")),
    budget: searchParams.get("budget") ?? undefined,
    limit: searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_query",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const venues = await searchRoomVenues(parsed.data);

    return NextResponse.json({
      venues,
      provider: "overpass",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "provider_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Venue provider request failed.",
        venues: [],
      },
      { status: 502 },
    );
  }
}
