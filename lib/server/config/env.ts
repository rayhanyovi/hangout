import { z } from "zod";

const booleanFlagSchema = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const disabledByDefaultBooleanFlagSchema = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  DATABASE_URL: z.string().trim().min(1).optional(),
  MAPBOX_ACCESS_TOKEN: z.string().trim().min(1).optional(),
  CRON_SECRET: z.string().trim().min(16).optional(),
  HANGOUT_ROOM_STORE_DIR: z.string().trim().min(1).optional(),
  HANGOUT_ENABLE_STRUCTURED_LOGS: booleanFlagSchema,
  HANGOUT_USE_FIXTURE_VENUES: disabledByDefaultBooleanFlagSchema,
  HANGOUT_USE_FIXTURE_ROUTING: disabledByDefaultBooleanFlagSchema,
  HANGOUT_ROUTING_PROVIDER: z.enum(["heuristic", "mapbox"]).default("heuristic"),
  HANGOUT_ROUTING_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(120),
  HANGOUT_ROUTING_STALE_TTL_SECONDS: z.coerce.number().int().min(60).max(7200).default(360),
  HANGOUT_ROUTING_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(5).max(300).default(30),
  HANGOUT_ROUTING_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(120).default(12),
  HANGOUT_VENUE_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(120),
  HANGOUT_VENUE_STALE_TTL_SECONDS: z.coerce.number().int().min(60).max(7200).default(360),
  HANGOUT_VENUE_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(5).max(300).default(30),
  HANGOUT_VENUE_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(60).default(6),
});

export function parseServerEnv(rawEnv: NodeJS.ProcessEnv) {
  const parsed = serverEnvSchema.safeParse(rawEnv);

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
    );
  }

  return parsed.data;
}

export const serverEnv = parseServerEnv(process.env);
