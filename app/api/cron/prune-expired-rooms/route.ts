import { NextRequest, NextResponse } from "next/server";
import { LOCATION_RETENTION_POLICY } from "@/lib/contracts/privacy";
import { serverEnv } from "@/lib/server/config/env";
import { isCronRequestAuthorized } from "@/lib/server/cron/auth";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { cleanupExpiredRooms } from "@/lib/server/rooms/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!serverEnv.CRON_SECRET) {
    logOperationalEvent(
      "room_cleanup_cron_unconfigured",
      {
        errorCode: "cron_secret_missing",
      },
      "error",
    );

    return NextResponse.json(
      {
        error: "cron_secret_missing",
        message: "CRON_SECRET is required for scheduled room cleanup.",
      },
      { status: 503 },
    );
  }

  const authorizationHeader = request.headers.get("authorization");

  if (!isCronRequestAuthorized(authorizationHeader, serverEnv.CRON_SECRET)) {
    logOperationalEvent(
      "room_cleanup_cron_unauthorized",
      {
        errorCode: "unauthorized",
      },
      "warn",
    );

    return NextResponse.json(
      {
        error: "unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const output = await cleanupExpiredRooms();

    return NextResponse.json(
      {
        ...output,
        cleanupWindowMinutes: LOCATION_RETENTION_POLICY.cleanupWindowMinutes,
      },
      { status: 200 },
    );
  } catch (error) {
    logOperationalEvent(
      "room_cleanup_cron_failed",
      {
        errorCode: "cleanup_failed",
        message:
          error instanceof Error ? error.message : "Room cleanup failed.",
      },
      "error",
    );

    return NextResponse.json(
      {
        error: "cleanup_failed",
        message:
          error instanceof Error ? error.message : "Room cleanup failed.",
      },
      { status: 500 },
    );
  }
}
