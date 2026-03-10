import { describe, expect, it } from "vitest";
import { buildDraftRoomMembers, memberHasLocation } from "@/lib/rooms";

describe("buildDraftRoomMembers", () => {
  it("builds a preview roster with host and seeded guests", () => {
    const members = buildDraftRoomMembers({
      title: "Friday catch-up",
      hostDisplayName: "Yovi",
      guestDisplayName: "Raka",
      transportMode: "motor",
      privacyMode: "approximate",
      categories: ["cafe"],
      tags: ["wifi"],
      radiusMDefault: 2000,
      previewMode: true,
    });

    expect(members).toHaveLength(3);
    expect(members[0]?.displayName).toBe("Yovi");
    expect(members[0]?.role).toBe("host");
    expect(members[1]?.displayName).toBe("Raka");
    expect(members.filter(memberHasLocation)).toHaveLength(3);
  });

  it("keeps an invite slot pending when a guest has not joined yet", () => {
    const members = buildDraftRoomMembers({
      title: null,
      hostDisplayName: "Yovi",
      transportMode: "motor",
      privacyMode: "approximate",
      categories: [],
      tags: [],
      radiusMDefault: 2000,
      previewMode: true,
    });

    expect(members[1]?.displayName).toBe("Menunggu anggota");
    expect(members[1]?.location).toBeNull();
    expect(members.filter(memberHasLocation)).toHaveLength(2);
  });
});
