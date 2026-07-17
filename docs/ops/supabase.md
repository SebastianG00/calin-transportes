# Supabase resources

## Storage

- **Private bucket: `guias`** — inbound driver media (photos of guías/PODs
  received via WhatsApp). `public: false`; accessed only by the server using
  the `SUPABASE_SERVICE_ROLE_KEY` (never exposed to the browser or the anon
  key). See spec §6 "Media at intake" — the webhook downloads provider media
  bytes into this bucket and records `media_storage_path` on the `messages`
  row.
- Created idempotently via `server/supabase/create-bucket.ts`
  (`npm run create-bucket -w server`) using the Supabase JS client, not the
  dashboard or CLI, so bucket provisioning is reproducible and scripted like
  the rest of this project's infra.

## Migrations

- Migrations live in `server/supabase/migrations/*.sql` and apply via the
  project's own minimal `pg`-based runner (`server/supabase/migrate.ts`), run
  with `npm run migrate -w server`. This environment does not use the
  Supabase CLI or Docker — the runner connects directly with `DATABASE_URL`
  and tracks applied migrations in a `_migrations` table, applying only the
  ones not yet recorded.

## Row Level Security (RLS)

- RLS is enabled on all 8 operational tables (`clients`, `drivers`, `units`,
  `loads`, `load_events`, `messages`, `pending_prompts`, `app_settings`).
- Authenticated office users get **read-only** access: a `select`-only policy
  (`to authenticated using (true)`) exists on `clients`, `drivers`, `units`,
  `loads`, `load_events`, and `messages`.
- `pending_prompts` and `app_settings` are server-internal — RLS is enabled
  with **no** policy, so all access (including reads) is denied to any role
  other than the service-role key.
- No `insert`/`update`/`delete` policies exist anywhere. The server writes
  exclusively via `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely.
  See `docs/superpowers/specs/2026-07-15-transportes-kalin-slice1-assign-confirm-design.md`
  §2 and §6.
