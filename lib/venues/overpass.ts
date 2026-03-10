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

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;

const OVERPASS_CATEGORY_TAGS: Record<
  VenueCategory,
  {
    amenity: string[];
    leisure: string[];
  }
> = {
  cafe: { amenity: ["cafe", "coffee_shop"], leisure: [] },
  restaurant: {
    amenity: ["restaurant", "fast_food", "food_court"],
    leisure: [],
  },
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

function buildAroundQuery(
  geometry: "node" | "way" | "relation",
  key: "amenity" | "leisure",
  regex: string,
  midpoint: Coordinate,
  radiusM: number,
) {
  return `${geometry}["${key}"~"${regex}"](around:${radiusM},${midpoint.lat},${midpoint.lng});`;
}

function buildOpenStreetMapUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
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
    queryParts.push(buildAroundQuery("node", "amenity", amenityRegex, midpoint, radiusM));
    queryParts.push(buildAroundQuery("way", "amenity", amenityRegex, midpoint, radiusM));
    queryParts.push(
      buildAroundQuery("relation", "amenity", amenityRegex, midpoint, radiusM),
    );
  }

  if (leisureTags.length > 0) {
    const leisureRegex = buildRegex(leisureTags);
    queryParts.push(buildAroundQuery("node", "leisure", leisureRegex, midpoint, radiusM));
    queryParts.push(buildAroundQuery("way", "leisure", leisureRegex, midpoint, radiusM));
    queryParts.push(
      buildAroundQuery("relation", "leisure", leisureRegex, midpoint, radiusM),
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
    mapUrl: buildOpenStreetMapUrl(lat, lng),
  };
}

async function fetchOverpassFromEndpoint(
  endpoint: string,
  query: string,
  signal?: AbortSignal,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: query,
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(10_000), signal])
      : AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Overpass search failed at ${endpoint} with status ${response.status}`);
  }

  return (await response.json()) as OverpassResponse;
}

export async function fetchOverpassVenues(
  midpoint: Coordinate,
  radiusM: number,
  categories: VenueCategory[],
  signal?: AbortSignal,
) {
  const query = buildOverpassQuery(midpoint, radiusM, categories);
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const payload = await fetchOverpassFromEndpoint(endpoint, query, signal);
      const elements = payload.elements ?? [];

      return elements
        .map((element) => normalizeOverpassVenue(element, midpoint))
        .filter((venue): venue is Venue => venue !== null);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Overpass search failed at ${endpoint}`);
    }
  }

  throw new Error(
    `OpenStreetMap Overpass search failed across all endpoints. ${errors.join(" | ")}`,
  );
}
