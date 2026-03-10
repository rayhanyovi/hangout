import { timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

export function isCronRequestAuthorized(
  authorizationHeader: string | null | undefined,
  secret: string,
) {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return false;
  }

  const providedSecret = Buffer.from(
    authorizationHeader.slice(BEARER_PREFIX.length),
    "utf8",
  );
  const expectedSecret = Buffer.from(secret, "utf8");

  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }

  return timingSafeEqual(providedSecret, expectedSecret);
}
