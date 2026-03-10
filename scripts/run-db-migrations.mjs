import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.join(__dirname, "..", "db", "migrations");

async function getMigrationFiles() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run database migrations.");
  }

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
    await client.query(`
      create table if not exists schema_migrations (
        migration_name text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrations = await getMigrationFiles();
    const appliedResult = await client.query(
      `
        select migration_name
        from schema_migrations
      `,
    );
    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.migration_name),
    );

    let appliedCount = 0;

    for (const migrationName of migrations) {
      if (appliedMigrations.has(migrationName)) {
        continue;
      }

      const migrationPath = path.join(migrationsDirectory, migrationName);
      const migrationSql = await readFile(migrationPath, "utf8");

      await client.query("begin");

      try {
        await client.query(migrationSql);
        await client.query(
          `
            insert into schema_migrations (migration_name)
            values ($1)
          `,
          [migrationName],
        );
        await client.query("commit");
        appliedCount += 1;
        console.log(`Applied migration ${migrationName}.`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(
          `Failed while applying migration ${migrationName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (appliedCount === 0) {
      console.log("No pending migrations.");
      return;
    }

    console.log(`Applied ${appliedCount} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
