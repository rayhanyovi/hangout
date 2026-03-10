import { serverEnv } from "@/lib/server/config/env";

type LogLevel = "info" | "warn" | "error";
type LogCategory = "analytics" | "operational";
type LogMetadataValue = boolean | number | string | null | undefined;

type StructuredLogInput = {
  level: LogLevel;
  category: LogCategory;
  event: string;
  metadata?: Record<string, LogMetadataValue>;
};

function compactMetadata(metadata: Record<string, LogMetadataValue> = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

function emitLog(level: LogLevel, payload: Record<string, unknown>) {
  if (!serverEnv.HANGOUT_ENABLE_STRUCTURED_LOGS) {
    return;
  }

  const serialized = JSON.stringify(payload);

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.info(serialized);
}

export function logStructuredEvent({
  level,
  category,
  event,
  metadata,
}: StructuredLogInput) {
  emitLog(level, {
    timestamp: new Date().toISOString(),
    env: serverEnv.VERCEL_ENV ?? serverEnv.NODE_ENV,
    source: "hangout-server",
    category,
    event,
    ...compactMetadata(metadata),
  });
}

export function trackAnalyticsEvent(
  event: string,
  metadata?: Record<string, LogMetadataValue>,
) {
  logStructuredEvent({
    level: "info",
    category: "analytics",
    event,
    metadata,
  });
}

export function logOperationalEvent(
  event: string,
  metadata?: Record<string, LogMetadataValue>,
  level: LogLevel = "warn",
) {
  logStructuredEvent({
    level,
    category: "operational",
    event,
    metadata,
  });
}
