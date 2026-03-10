import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/server/config/env";

describe("parseServerEnv", () => {
  it("applies documented defaults", () => {
    const env = parseServerEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.HANGOUT_ENABLE_STRUCTURED_LOGS).toBe(true);
    expect(env.HANGOUT_VENUE_CACHE_TTL_SECONDS).toBe(120);
    expect(env.HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS).toBe(6);
  });

  it("parses explicit overrides", () => {
    const env = parseServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://hangout:secret@localhost:5432/hangout",
      CRON_SECRET: "1234567890abcdef",
      HANGOUT_ENABLE_STRUCTURED_LOGS: "false",
      HANGOUT_ROOM_STORE_DIR: "/tmp/hangout-prod",
      HANGOUT_VENUE_CACHE_TTL_SECONDS: "180",
      HANGOUT_VENUE_STALE_TTL_SECONDS: "540",
      HANGOUT_VENUE_RATE_LIMIT_WINDOW_SECONDS: "45",
      HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS: "9",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.DATABASE_URL).toBe(
      "postgresql://hangout:secret@localhost:5432/hangout",
    );
    expect(env.CRON_SECRET).toBe("1234567890abcdef");
    expect(env.HANGOUT_ENABLE_STRUCTURED_LOGS).toBe(false);
    expect(env.HANGOUT_ROOM_STORE_DIR).toBe("/tmp/hangout-prod");
    expect(env.HANGOUT_VENUE_CACHE_TTL_SECONDS).toBe(180);
    expect(env.HANGOUT_VENUE_STALE_TTL_SECONDS).toBe(540);
    expect(env.HANGOUT_VENUE_RATE_LIMIT_WINDOW_SECONDS).toBe(45);
    expect(env.HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS).toBe(9);
  });
});
