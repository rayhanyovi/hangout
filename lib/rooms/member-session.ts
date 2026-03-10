const ROOM_MEMBER_COOKIE_PREFIX = "hangout_room_member_";
const ROOM_MEMBER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getRoomMemberCookieName(joinCode: string) {
  return `${ROOM_MEMBER_COOKIE_PREFIX}${joinCode.toUpperCase()}`;
}

export function persistRoomMemberCookie(joinCode: string, memberId: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${getRoomMemberCookieName(joinCode)}=${encodeURIComponent(memberId)}`,
    "Path=/",
    `Max-Age=${ROOM_MEMBER_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function readRoomMemberCookie(
  cookieStore: {
    get: (name: string) => { value: string } | undefined;
  },
  joinCode: string,
) {
  return cookieStore.get(getRoomMemberCookieName(joinCode))?.value ?? null;
}
