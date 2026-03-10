import type { Coordinate, Venue, VenueCategory } from "@/lib/contracts";
import { haversineKm } from "@/lib/math";

type OverpassTags = Record<string, string>;

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: OverpassTags;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const OVERPASS_CATEGORY_TAGS: Record<
  VenueCategory,
  {
    amenity: string[];
    leisure: string[];
  }
> = {
  cafe: { amenity: ["cafe", "coffee_shop"], leisure: [] },
  restaurant: { amenity: ["restaurant", "fast_food", "food_court"], leisure: [] },
  park: { amenity: [], leisure: ["park", "garden", "playground"] },
  mall: { amenity: ["mall", "marketplace"], leisure: [] },
  other: {
    amenity: ["bar", "pub", "library", "cinema", "community_centre"],
    leisure: [],
  },
};

function buildRegex(tags: string[]) {
  return tags.join("|");
}

export function buildOverpassQuery(
  midpoint: Coordinate,
  radiusM: number,
  categories: VenueCategory[],
) {
  const activeCategories =
    categories.length > 0
      ? categories
      : (Object.keys(OVERPASS_CATEGORY_TAGS) as VenueCategory[]);

  const amenityTags = activeCategories.flatMap(
    (category) => OVERPASS_CATEGORY_TAGS[category].amenity,
  );
  const leisureTags = activeCategories.flatMap(
    (category) => OVERPASS_CATEGORY_TAGS[category].leisure,
  );

  const queryParts: string[] = [];

  if (amenityTags.length > 0) {
    const amenityRegex = buildRegex(amenityTags);
    queryParts.push(
      `node["amenity"~"${amenityRegex}"](around:${radiusM},${midpoint.lat},${midpoint.lng});`,
    );
    queryParts.push(
      `way["amenity"~"${amenityRegex}"](around:${radiusM},${midpoint.lat},${midpoint.lng});`,
    );
  }

  if (leisureTags.length > 0) {
    const leisureRegex = buildRegex(leisureTags);
    queryParts.push(
      `node["leisure"~"${leisureRegex}"](around:${radiusM},${midpoint.lat},${midpoint.lng});`,
    );
    queryParts.push(
      `way["leisure"~"${leisureRegex}"](around:${radiusM},${midpoint.lat},${midpoint.lng});`,
    );
  }

  return `[out:json][timeout:10];(${queryParts.join("")});out center 30;`;
}

export function getVenueCategoryFromTags(tags: OverpassTags): VenueCategory {
  const amenity = tags.amenity ?? "";
  const leisure = tags.leisure ?? "";

  if (OVERPASS_CATEGORY_TAGS.cafe.amenity.includes(amenity)) {
    return "cafe";
  }

  if (OVERPASS_CATEGORY_TAGS.restaurant.amenity.includes(amenity)) {
    return "restaurant";
  }

  if (OVERPASS_CATEGORY_TAGS.park.leisure.includes(leisure)) {
    return "park";
  }

  if (OVERPASS_CATEGORY_TAGS.mall.amenity.includes(amenity)) {
    return "mall";
  }

  return "other";
}

export function normalizeOverpassVenue(
  element: OverpassElement,
  midpoint: Coordinate,
): Venue | null {
  const tags = element.tags;

  if (!tags?.name) {
    return null;
  }

  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (lat === undefined || lng === undefined) {
    return null;
  }

  return {
    venueId: `osm_${element.id}`,
    providerId: String(element.id),
    name: tags.name,
    category: getVenueCategoryFromTags(tags),
    lat,
    lng,
    address: tags["addr:street"]
      ? `${tags["addr:street"]} ${tags["addr:housenumber"] ?? ""}`.trim()
      : null,
    distanceToCenterM: Math.round(haversineKm(midpoint, { lat, lng }) * 1000),
    tags: [
      tags.cuisine,
      tags.internet_access === "wlan" ? "wifi" : null,
      tags.outdoor_seating === "yes" ? "outdoor" : null,
      tags.smoking === "no" ? "no smoking" : null,
    ].filter((tag): tag is string => Boolean(tag)),
    mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
  };
}

export async function fetchOverpassVenues(
  midpoint: Coordinate,
  radiusM: number,
  categories: VenueCategory[],
  signal?: AbortSignal,
) {
  const query = buildOverpassQuery(midpoint, radiusM, categories);
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: query,
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(10_000), signal])
      : AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Overpass search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OverpassResponse;
  const elements = payload.elements ?? [];

  return elements
    .map((element) => normalizeOverpassVenue(element, midpoint))
    .filter((venue): venue is Venue => venue !== null);
}
