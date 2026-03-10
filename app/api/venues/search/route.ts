import { NextRequest, NextResponse } from "next/server";
import { setRoomVenueCache } from "@/lib/server/rooms/repository";
import {
  searchRoomVenues,
  VenueSearchRateLimitError,
} from "@/lib/server/venues/search";
import { searchVenuesSchema } from "@/lib/validation";
import { VENUE_CATEGORIES, type VenueCategory } from "@/lib/contracts";

export const runtime = "nodejs";
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

function getRequesterKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "anonymous";

  return `client:${ip}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const joinCode = searchParams.get("joinCode")?.trim().toUpperCase();
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
    const result = await searchRoomVenues({
      ...parsed.data,
      rateLimitKey: joinCode ? `room:${joinCode}` : getRequesterKey(request),
    });

    if (joinCode) {
      await setRoomVenueCache(joinCode, result.venues);
    }

    return NextResponse.json(
      {
        venues: result.venues,
        provider: result.provider,
        cacheStatus: result.cacheStatus,
        rateLimit: result.rateLimit,
      },
      {
        headers: {
          "X-Hangout-Venue-Cache": result.cacheStatus,
          "X-Hangout-Venue-Rate-Limited": String(result.rateLimit.limited),
          ...(result.rateLimit.retryAfterSeconds !== null
            ? {
                "Retry-After": String(result.rateLimit.retryAfterSeconds),
              }
            : {}),
        },
      },
    );
  } catch (error) {
    if (error instanceof VenueSearchRateLimitError) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `Venue search is temporarily rate limited. Retry in ${error.retryAfterSeconds} seconds.`,
          venues: [],
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        },
      );
    }

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
