import { NextRequest, NextResponse } from "next/server";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import {
  getRoomSnapshot,
  updateMemberLocation,
  updateRoomDetails,
} from "@/lib/server/rooms/repository";
import { updateMemberLocationSchema, updateRoomDetailsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoomRouteContext = {
  params: Promise<{
    joinCode: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RoomRouteContext,
) {
  const { joinCode } = await context.params;
  const snapshot = await getRoomSnapshot(joinCode.toUpperCase());

  if (!snapshot) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "Room not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(snapshot);
}

export async function PATCH(
  request: NextRequest,
  context: RoomRouteContext,
) {
  const { joinCode } = await context.params;
  const payload = await request.json();

  if (payload.location) {
    const parsed = updateMemberLocationSchema.safeParse({
      roomId: payload.roomId ?? joinCode.toUpperCase(),
      actorMemberId: payload.actorMemberId,
      memberId: payload.memberId,
      location: payload.location,
    });

    if (!parsed.success) {
      logOperationalEvent("location_update_invalid_payload", {
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
      const output = await updateMemberLocation(
        joinCode.toUpperCase(),
        parsed.data.actorMemberId,
        parsed.data.memberId,
        parsed.data.location,
      );

      return NextResponse.json(output);
    } catch (error) {
      logOperationalEvent("location_update_failed", {
        joinCode: joinCode.toUpperCase(),
        actorMemberId: parsed.data.actorMemberId,
        memberId: parsed.data.memberId,
        errorCode: "update_failed",
        message:
          error instanceof Error
            ? error.message
            : "Location update request failed.",
      });

      return NextResponse.json(
        {
          error: "update_failed",
          message:
            error instanceof Error
              ? error.message
              : "Location update request failed.",
        },
        { status: 404 },
      );
    }
  }

  const parsed = updateRoomDetailsSchema.safeParse({
    roomId: payload.roomId ?? joinCode.toUpperCase(),
    actorMemberId: payload.actorMemberId,
    title: payload.title,
    description: payload.description,
    scheduledLabel: payload.scheduledLabel,
  });

  if (!parsed.success) {
    logOperationalEvent("room_details_update_invalid_payload", {
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
    const output = await updateRoomDetails(
      joinCode.toUpperCase(),
      parsed.data.actorMemberId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        scheduledLabel: parsed.data.scheduledLabel,
      },
    );

    return NextResponse.json(output);
  } catch (error) {
    logOperationalEvent("room_details_update_failed", {
      joinCode: joinCode.toUpperCase(),
      actorMemberId: parsed.data.actorMemberId,
      errorCode: "update_failed",
      message:
        error instanceof Error
          ? error.message
          : "Room details update failed.",
    });

    return NextResponse.json(
      {
        error: "update_failed",
        message:
          error instanceof Error
            ? error.message
            : "Room details update failed.",
      },
      { status: 404 },
    );
  }
}
