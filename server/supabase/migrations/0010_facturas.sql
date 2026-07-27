-- Facturas: uploaded invoice images → VLM-extracted accountant fields → human-confirmed → CSV export.
-- No SUNAT QR (plain images). Standalone (optional client link); NOT welded to a load.
create table facturas (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,                 -- private 'facturas' bucket
  client_id uuid references clients(id),    -- optional link (per-client grouping)
  extracted jsonb not null default '{}'::jsonb,  -- { field: {value, verbatim, source, bbox?} }
  review_status text not null default 'pending' check (review_status in ('pending','confirmed','rejected')),
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index facturas_status_idx on facturas (review_status);

-- RLS: authenticated can read; no write policy → only the service-role key writes.
alter table facturas enable row level security;
create policy office_read_facturas on facturas for select to authenticated using (true);

-- Realtime for the live list. supabase_realtime may already be FOR ALL TABLES; guard.
do $$ begin
  alter publication supabase_realtime add table facturas;
exception when duplicate_object then null; when others then null; end $$;
