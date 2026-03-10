import { NextRequest, NextResponse } from "next/server";
import { logOperationalEvent } from "@/lib/server/observability/logger";
import { castVote } from "@/lib/server/rooms/repository";
import { castVoteSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoteRouteContext = {
  params: Promise<{
    joinCode: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: VoteRouteContext,
) {
  const { joinCode } = await context.params;
  const payload = await request.json();
  const parsed = castVoteSchema.safeParse({
    roomId: payload.roomId ?? joinCode.toUpperCase(),
    memberId: payload.memberId,
    venueId: payload.venueId,
    reaction: payload.reaction,
    comment: payload.comment,
  });

  if (!parsed.success) {
    logOperationalEvent("vote_invalid_payload", {
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
    const output = await castVote(
      joinCode.toUpperCase(),
      parsed.data.memberId,
      parsed.data.venueId,
      parsed.data.reaction,
      parsed.data.comment,
    );

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    logOperationalEvent("vote_failed", {
      joinCode: joinCode.toUpperCase(),
      memberId: parsed.data.memberId,
      venueId: parsed.data.venueId,
      errorCode: "vote_failed",
      message: error instanceof Error ? error.message : "Vote request failed.",
    });

    return NextResponse.json(
      {
        error: "vote_failed",
        message: error instanceof Error ? error.message : "Vote request failed.",
      },
      { status: 400 },
    );
  }
}
