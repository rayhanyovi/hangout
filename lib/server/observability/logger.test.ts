import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  logOperationalEvent,
  trackAnalyticsEvent,
} from "@/lib/server/observability/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits analytics events as structured info logs", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackAnalyticsEvent("room_created", {
      joinCode: "ROOM42",
      memberId: "member-1",
      locatedMemberCount: 1,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toContain("\"category\":\"analytics\"");
    expect(infoSpy.mock.calls[0]?.[0]).toContain("\"event\":\"room_created\"");
    expect(infoSpy.mock.calls[0]?.[0]).toContain("\"joinCode\":\"ROOM42\"");
  });

  it("emits operational events without undefined fields", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logOperationalEvent("venue_search_failed", {
      joinCode: "ROOM42",
      errorCode: "provider_unavailable",
      provider: undefined,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("\"category\":\"operational\"");
    expect(warnSpy.mock.calls[0]?.[0]).toContain("\"errorCode\":\"provider_unavailable\"");
    expect(warnSpy.mock.calls[0]?.[0]).not.toContain("\"provider\":");
  });
});
