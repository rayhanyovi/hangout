import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to apply the db/schema.sql snapshot.");
  }

  const schemaSql = await readFile(schemaPath, "utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  await client.connect();

  try {
    await client.query(schemaSql);
    console.log("Applied PostgreSQL schema snapshot from db/schema.sql.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
