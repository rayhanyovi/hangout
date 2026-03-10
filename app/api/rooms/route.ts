import { NextRequest, NextResponse } from "next/server";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { createRoom } from "@/lib/server/rooms/repository";
import { createRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createRoomSchema.safeParse(payload);

  if (!parsed.success) {
    logOperationalEvent("room_create_invalid_payload", {
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
    const output = await createRoom(parsed.data, request.nextUrl.origin);

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    logOperationalEvent(
      "room_create_failed",
      {
        errorCode: "create_failed",
        message:
          error instanceof Error ? error.message : "Room creation failed.",
      },
      "error",
    );

    return NextResponse.json(
      {
        error: "create_failed",
        message:
          error instanceof Error ? error.message : "Room creation failed.",
      },
      { status: 500 },
    );
  }
}
