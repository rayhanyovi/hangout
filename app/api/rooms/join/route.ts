import { NextRequest, NextResponse } from "next/server";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { joinRoom } from "@/lib/server/rooms/repository";
import { joinRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = joinRoomSchema.safeParse(payload);

  if (!parsed.success) {
    logOperationalEvent("room_join_invalid_payload", {
      issueCount: parsed.error.issues.length,
    });

    return NextResponse.json(
      {
        error: "invalid_payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const output = await joinRoom(parsed.data);

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    logOperationalEvent("room_join_failed", {
      joinCode: parsed.data.joinCode,
      errorCode: "join_failed",
      message: error instanceof Error ? error.message : "Join request failed.",
    });

    return NextResponse.json(
      {
        error: "join_failed",
        message: error instanceof Error ? error.message : "Join request failed.",
      },
      { status: 404 },
    );
  }
}
