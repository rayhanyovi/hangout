import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  updateMemberLocationSchema,
} from "@/lib/validation";

describe("room flow validation", () => {
  it("accepts a valid room creation payload", () => {
    const result = createRoomSchema.safeParse({
      title: "Geng Kampus",
      hostDisplayName: "Yovi",
      transportMode: "motor",
      privacyMode: "approximate",
      venuePreferences: {
        categories: ["cafe", "restaurant"],
        tags: ["wifi", "cozy"],
        budget: "mid",
        radiusMDefault: 2000,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid coordinate payloads", () => {
    const result = updateMemberLocationSchema.safeParse({
      roomId: "rm_1",
      memberId: "mb_1",
      location: {
        source: "gps",
        lat: 200,
        lng: 106.8,
        updatedAt: "2026-03-10T10:00:00.000Z",
      },
    });

    expect(result.success).toBe(false);
  });
});
