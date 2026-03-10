import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/server/rooms/repository";
import { createRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createRoomSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const output = await createRoom(parsed.data, request.nextUrl.origin);

  return NextResponse.json(output, { status: 201 });
}
