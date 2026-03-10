import { NextRequest, NextResponse } from "next/server";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { finalizeRoom } from "@/lib/server/rooms/repository";
import { finalizeRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FinalizeRouteContext = {
  params: Promise<{
    joinCode: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: FinalizeRouteContext,
) {
  const { joinCode } = await context.params;
  const payload = await request.json();
  const parsed = finalizeRoomSchema.safeParse({
    roomId: payload.roomId ?? joinCode.toUpperCase(),
    memberId: payload.memberId,
    venueId: payload.venueId,
  });

  if (!parsed.success) {
    logOperationalEvent("room_finalize_invalid_payload", {
      joinCode: joinCode.toUpperCase(),
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
    const output = await finalizeRoom(
      joinCode.toUpperCase(),
      parsed.data.memberId,
      parsed.data.venueId,
      request.nextUrl.origin,
    );

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    logOperationalEvent("room_finalize_failed", {
      joinCode: joinCode.toUpperCase(),
      memberId: parsed.data.memberId,
      venueId: parsed.data.venueId,
      errorCode: "finalize_failed",
      message:
        error instanceof Error ? error.message : "Finalize request failed.",
    });

    return NextResponse.json(
      {
        error: "finalize_failed",
        message:
          error instanceof Error
            ? error.message
            : "Finalize request failed.",
      },
      { status: 400 },
    );
  }
}
