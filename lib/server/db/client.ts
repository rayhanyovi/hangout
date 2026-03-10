import "server-only";

import { Pool } from "pg";
import { serverEnv } from "@/lib/server/config/env";

declare global {
  var __hangoutPgPool: Pool | undefined;
}

export function isPostgresConfigured() {
  return Boolean(serverEnv.DATABASE_URL);
}

export function getPostgresPool() {
  if (!serverEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__hangoutPgPool) {
    globalThis.__hangoutPgPool = new Pool({
      connectionString: serverEnv.DATABASE_URL,
      max: 10,
      ssl:
        serverEnv.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : false,
    });
  }

  return globalThis.__hangoutPgPool;
}
