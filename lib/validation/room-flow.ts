import { z } from "zod";
import {
  LOCATION_SOURCES,
  PRIVACY_MODES,
  TRANSPORT_MODES,
  VENUE_CATEGORIES,
} from "@/lib/contracts";

const identifierSchema = z.string().min(1);
const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createRoomSchema = z.object({
  title: z.string().trim().min(1).max(80).nullable(),
  hostDisplayName: z.string().trim().min(1).max(40),
  transportMode: z.enum(TRANSPORT_MODES),
  privacyMode: z.enum(PRIVACY_MODES),
  venuePreferences: z.object({
    categories: z.array(z.enum(VENUE_CATEGORIES)).default([]),
    tags: z.array(z.string().trim().min(1).max(24)).default([]),
    budget: z.enum(["low", "mid", "high"]).optional(),
    radiusMDefault: z.number().int().positive().max(10000),
  }),
});

export const joinRoomSchema = z.object({
  joinCode: z.string().trim().min(4).max(12),
  displayName: z.string().trim().min(1).max(40),
});

export const updateMemberLocationSchema = z.object({
  roomId: identifierSchema,
  memberId: identifierSchema,
  location: coordinateSchema.extend({
    source: z.enum(LOCATION_SOURCES),
    accuracyM: z.number().positive().optional(),
    updatedAt: z.string().datetime(),
  }),
});

export const castVoteSchema = z.object({
  roomId: identifierSchema,
  memberId: identifierSchema,
  venueId: identifierSchema,
  reaction: z.string().trim().min(1).max(8).optional(),
  comment: z.string().trim().min(1).max(240).optional(),
});

export const finalizeRoomSchema = z.object({
  roomId: identifierSchema,
  memberId: identifierSchema,
  venueId: identifierSchema,
});

export const searchVenuesSchema = z.object({
  midpoint: coordinateSchema,
  radiusM: z.number().int().positive().max(10000),
  categories: z.array(z.enum(VENUE_CATEGORIES)).default([]),
  tags: z.array(z.string().trim().min(1).max(24)).default([]),
  budget: z.enum(["low", "mid", "high"]).optional(),
  limit: z.number().int().min(1).max(12).default(8),
});
