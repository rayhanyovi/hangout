import type {
  BudgetLevel,
  Venue,
  VenueCategory,
  VenuePreferences,
} from "@/lib/contracts";

export type RankedVenue = Venue & {
  score: number;
  matchedTags: string[];
};

const BUDGET_TO_PRICE_LEVEL: Record<BudgetLevel, number> = {
  low: 1,
  mid: 2,
  high: 3,
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function dedupeVenues(venues: Venue[]) {
  const seen = new Set<string>();

  return venues.filter((venue) => {
    const key = [
      venue.name.trim().toLowerCase(),
      venue.category,
      venue.lat.toFixed(5),
      venue.lng.toFixed(5),
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function findMatchedTags(venueTags: string[], requestedTags: string[]) {
  const normalizedVenueTags = venueTags.map(normalizeToken);

  return requestedTags.filter((requestedTag) =>
    normalizedVenueTags.some(
      (venueTag) =>
        venueTag.includes(requestedTag) || requestedTag.includes(venueTag),
    ),
  );
}

function getBudgetScore(
  venue: Venue,
  requestedBudget: BudgetLevel | undefined,
) {
  if (!requestedBudget || venue.priceLevel === undefined) {
    return 0;
  }

  const delta = Math.abs(venue.priceLevel - BUDGET_TO_PRICE_LEVEL[requestedBudget]);
  return Math.max(0, 10 - delta * 4);
}

function scoreVenue(venue: Venue, preferences: VenuePreferences): RankedVenue {
  const requestedTags = preferences.tags.map(normalizeToken);
  const matchedTags = findMatchedTags(venue.tags, requestedTags);
  const radiusM = Math.max(500, preferences.radiusMDefault);
  const distanceScore = Math.max(
    0,
    60 - (Math.min(venue.distanceToCenterM, radiusM) / radiusM) * 60,
  );
  const categoryScore =
    preferences.categories.length === 0 ||
    preferences.categories.includes(venue.category)
      ? 20
      : 0;
  const tagScore = Math.min(20, matchedTags.length * 8);
  const budgetScore = getBudgetScore(venue, preferences.budget);
  const openNowScore = venue.openNow ? 5 : 0;

  return {
    ...venue,
    score: Math.round((distanceScore + categoryScore + tagScore + budgetScore + openNowScore) * 10) / 10,
    matchedTags,
  };
}

export function rankVenuesForRoom(
  venues: Venue[],
  preferences: VenuePreferences,
  limit = 8,
) {
  return dedupeVenues(venues)
    .filter(
      (venue) =>
        preferences.categories.length === 0 ||
        preferences.categories.includes(venue.category),
    )
    .map((venue) => scoreVenue(venue, preferences))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.distanceToCenterM - right.distanceToCenterM ||
        left.name.localeCompare(right.name),
    )
    .slice(0, limit);
}

export function filterRankedVenues(
  venues: RankedVenue[],
  activeCategories: VenueCategory[],
) {
  if (activeCategories.length === 0) {
    return venues;
  }

  return venues.filter((venue) => activeCategories.includes(venue.category));
}
