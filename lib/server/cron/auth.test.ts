import { describe, expect, it } from "vitest";
import { isCronRequestAuthorized } from "@/lib/server/cron/auth";

describe("isCronRequestAuthorized", () => {
  const secret = "1234567890abcdef";

  it("accepts the matching bearer token", () => {
    expect(isCronRequestAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects missing or malformed headers", () => {
    expect(isCronRequestAuthorized(null, secret)).toBe(false);
    expect(isCronRequestAuthorized(secret, secret)).toBe(false);
    expect(isCronRequestAuthorized(`Token ${secret}`, secret)).toBe(false);
  });

  it("rejects the wrong bearer token", () => {
    expect(
      isCronRequestAuthorized("Bearer fedcba0987654321", secret),
    ).toBe(false);
  });
});
