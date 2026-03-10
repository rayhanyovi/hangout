import { NextRequest, NextResponse } from "next/server";
import { addRoomMember } from "@/lib/server/rooms/repository";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { addRoomMemberSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoomMembersRouteContext = {
  params: Promise<{
    joinCode: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RoomMembersRouteContext,
) {
  const { joinCode } = await context.params;
  const payload = await request.json();
  const parsed = addRoomMemberSchema.safeParse({
    roomId: payload.roomId ?? joinCode.toUpperCase(),
    actorMemberId: payload.actorMemberId,
    displayName: payload.displayName,
  });

  if (!parsed.success) {
    logOperationalEvent("room_member_add_invalid_payload", {
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
    const output = await addRoomMember(
      joinCode.toUpperCase(),
      parsed.data.actorMemberId,
      parsed.data.displayName,
    );

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    logOperationalEvent("room_member_add_failed", {
      joinCode: joinCode.toUpperCase(),
      actorMemberId: parsed.data.actorMemberId,
      errorCode: "add_member_failed",
      message:
        error instanceof Error ? error.message : "Add room member failed.",
    });

    return NextResponse.json(
      {
        error: "add_member_failed",
        message:
          error instanceof Error ? error.message : "Add room member failed.",
      },
      { status: 400 },
    );
  }
}
