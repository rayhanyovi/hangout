import { describe, expect, it } from "vitest";
import { createValidatedMemberLocation } from "@/lib/rooms/location-input";

describe("createValidatedMemberLocation", () => {
  it("rounds approximate locations before validation", () => {
    const location = createValidatedMemberLocation({
      lat: -6.214598,
      lng: 106.845134,
      privacyMode: "approximate",
      source: "pinned",
      nowIso: "2026-03-10T00:00:00.000Z",
    });

    expect(location).toEqual({
      lat: -6.215,
      lng: 106.845,
      source: "pinned",
      updatedAt: "2026-03-10T00:00:00.000Z",
    });
  });

  it("preserves higher precision for exact mode", () => {
    const location = createValidatedMemberLocation({
      accuracyM: 18,
      lat: -6.214598,
      lng: 106.845134,
      privacyMode: "exact",
      source: "gps",
      nowIso: "2026-03-10T00:00:00.000Z",
    });

    expect(location).toEqual({
      accuracyM: 18,
      lat: -6.2146,
      lng: 106.84513,
      source: "gps",
      updatedAt: "2026-03-10T00:00:00.000Z",
    });
  });
});
