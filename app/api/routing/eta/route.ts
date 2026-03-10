import { NextRequest, NextResponse } from "next/server";
import { fairnessEtaSchema } from "@/lib/validation";
import {
  logOperationalEvent,
  trackAnalyticsEvent,
} from "@/lib/server/observability/logger";
import { resolveFairnessEta } from "@/lib/server/routing/eta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequesterKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "anonymous";

  return `client:${ip}`;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const payload = await request.json();
  const parsed = fairnessEtaSchema.safeParse(payload);

  if (!parsed.success) {
    logOperationalEvent("fairness_eta_invalid_payload", {
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
    const result = await resolveFairnessEta({
      ...parsed.data,
      rateLimitKey: parsed.data.joinCode
        ? `room:${parsed.data.joinCode.toUpperCase()}`
        : getRequesterKey(request),
      signal: request.signal,
    });

    trackAnalyticsEvent("fairness_eta_completed", {
      joinCode: parsed.data.joinCode?.toUpperCase() ?? null,
      memberCount: parsed.data.members.length,
      transportMode: parsed.data.transportMode,
      source: result.source,
      cacheStatus: result.cacheStatus,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(result, {
      headers: {
        "X-Hangout-Fairness-ETA-Source": result.source,
        "X-Hangout-Fairness-ETA-Cache": result.cacheStatus,
      },
    });
  } catch (error) {
    logOperationalEvent(
      "fairness_eta_failed",
      {
        joinCode: parsed.data.joinCode?.toUpperCase() ?? null,
        transportMode: parsed.data.transportMode,
        message:
          error instanceof Error
            ? error.message
            : "Fairness ETA request failed.",
        durationMs: Date.now() - startedAt,
      },
      "error",
    );

    return NextResponse.json(
      {
        error: "routing_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Fairness ETA request failed.",
      },
      { status: 502 },
    );
  }
}
