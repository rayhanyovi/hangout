import { NextRequest, NextResponse } from "next/server";
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
