-- Restore Supabase's default API-role privileges.
-- migrate.ts applies migrations over a raw pg connection as `postgres`, which
-- bypasses Supabase's automatic ALTER DEFAULT PRIVILEGES wiring, so tables in
-- 0001 got no grants for anon/authenticated/service_role. RLS (0002) still
-- gates all writes; these grants only restore the baseline every Supabase
-- project normally has. Writes remain impossible for anon/authenticated
-- (no RLS write policy); service_role bypasses RLS.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Data integrity: one client per RUC (also enables a native upsert-by-ruc).
alter table clients add constraint clients_ruc_key unique (ruc);
