// Minimal, idempotent SQL migration runner (Supabase CLI is not installed
// in this environment, so we apply migrations directly against
// DATABASE_URL with `pg`). Deviation from the task brief, agreed for Task 5.
//
// Usage: node --env-file=.env --import tsx supabase/migrate.ts
// (run from server/, or via `npm run migrate -w server` from repo root)

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`
      create table if not exists _migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const { rows } = await client.query<{ name: string }>(
      "select name from _migrations",
    );
    const applied = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip (already applied): ${file}`);
        continue;
      }

      const sql = readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into _migrations (name) values ($1)", [
          file,
        ]);
        await client.query("commit");
        console.log(`applied: ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`failed to apply ${file}: ${(err as Error).message}`, {
          cause: err,
        });
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
