import { z } from "zod";
import {
  PRIVACY_MODES,
  TRANSPORT_MODES,
  VENUE_CATEGORIES,
  type BudgetLevel,
  type PrivacyMode,
  type TransportMode,
  type VenueCategory,
} from "@/lib/contracts";

export type DraftRoomSeed = {
  title: string | null;
  hostDisplayName: string;
  guestDisplayName?: string;
  transportMode: TransportMode;
  privacyMode: PrivacyMode;
  categories: VenueCategory[];
  tags: string[];
  budget?: BudgetLevel;
  radiusMDefault: number;
  previewMode: boolean;
};

const draftRoomSearchSchema = z.object({
  preview: z.enum(["1"]).optional(),
  title: z.string().trim().max(80).optional(),
  host: z.string().trim().min(1).max(40).optional(),
  guest: z.string().trim().min(1).max(40).optional(),
  transport: z.enum(TRANSPORT_MODES).optional(),
  privacy: z.enum(PRIVACY_MODES).optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
  budget: z.enum(["low", "mid", "high"]).optional(),
  radius: z.coerce.number().int().positive().max(10000).optional(),
});

export function createDraftJoinCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function serializeDraftRoomSearchParams(seed: DraftRoomSeed) {
  const params = new URLSearchParams();

  if (seed.previewMode) {
    params.set("preview", "1");
  }

  if (seed.title) {
    params.set("title", seed.title);
  }

  params.set("host", seed.hostDisplayName);
  params.set("transport", seed.transportMode);
  params.set("privacy", seed.privacyMode);
  params.set("radius", String(seed.radiusMDefault));

  if (seed.guestDisplayName) {
    params.set("guest", seed.guestDisplayName);
  }

  if (seed.categories.length > 0) {
    params.set("categories", seed.categories.join(","));
  }

  if (seed.tags.length > 0) {
    params.set("tags", seed.tags.join(","));
  }

  if (seed.budget) {
    params.set("budget", seed.budget);
  }

  return params;
}

export function parseDraftRoomSearchParams(
  rawSearchParams: Record<string, string | string[] | undefined>,
): DraftRoomSeed {
  const normalizedInput = {
    preview: getFirstValue(rawSearchParams.preview),
    title: getFirstValue(rawSearchParams.title),
    host: getFirstValue(rawSearchParams.host),
    guest: getFirstValue(rawSearchParams.guest),
    transport: getFirstValue(rawSearchParams.transport),
    privacy: getFirstValue(rawSearchParams.privacy),
    categories: getFirstValue(rawSearchParams.categories),
    tags: getFirstValue(rawSearchParams.tags),
    budget: getFirstValue(rawSearchParams.budget),
    radius: getFirstValue(rawSearchParams.radius),
  };

  const parsed = draftRoomSearchSchema.safeParse(normalizedInput);

  if (!parsed.success) {
    return {
      title: null,
      hostDisplayName: "Host",
      transportMode: "motor",
      privacyMode: "approximate",
      categories: [],
      tags: [],
      radiusMDefault: 2000,
      previewMode: false,
    };
  }

  return {
    title: parsed.data.title?.trim() ? parsed.data.title.trim() : null,
    hostDisplayName: parsed.data.host ?? "Host",
    guestDisplayName: parsed.data.guest,
    transportMode: parsed.data.transport ?? "motor",
    privacyMode: parsed.data.privacy ?? "approximate",
    categories: parseCommaSeparatedList(parsed.data.categories).filter(
      (category): category is VenueCategory =>
        VENUE_CATEGORIES.includes(category as VenueCategory),
    ),
    tags: parseCommaSeparatedList(parsed.data.tags),
    budget: parsed.data.budget,
    radiusMDefault: parsed.data.radius ?? 2000,
    previewMode: parsed.data.preview === "1",
  };
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCommaSeparatedList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
