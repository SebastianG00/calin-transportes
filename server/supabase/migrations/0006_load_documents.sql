-- Slice 2 Tier 1: deterministic delivery-document pipeline output.
-- One row per processed guía/factura photo. review_status starts 'pending';
-- validation ANNOTATES (green/amber/red) but never auto-accepts — a human
-- confirms every document (Tier-1 launch policy). `extracted` stores per-field
-- {value, source:'qr'|'human', checks:[...]} so Tier-2 bbox grounding slots in
-- with no migration. `phash` (added beyond the design's core fields) backs the
-- stage-0 perceptual-hash dedup of idempotent re-sends.
create table load_documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id),
  message_id uuid references messages(id),
  doc_type text not null check (doc_type in ('gre_remitente','gre_transportista','factura','other')),
  ruc text,
  serie text,
  numero text,
  fecha date,
  phash text,
  extracted jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending','confirmed','rejected')),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index load_documents_load_id_idx on load_documents (load_id, created_at);
create index load_documents_review_status_idx on load_documents (review_status, created_at);

-- Append-only audit + future eval dataset: every validation verdict and every
-- human correction. Never updated.
create table document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references load_documents(id),
  kind text not null,            -- 'validated' | 'confirmed' | 'rejected' | 'correction'
  detail jsonb not null default '{}'::jsonb,
  actor text not null,
  created_at timestamptz not null default now()
);
create index document_events_document_idx on document_events (document_id, created_at);

-- RLS: office reads only; the server (service-role) bypasses RLS to write.
alter table load_documents enable row level security;
alter table document_events enable row level security;
create policy office_read_documents on load_documents for select to authenticated using (true);
create policy office_read_document_events on document_events for select to authenticated using (true);

-- Realtime for the Revisión queue. supabase_realtime may already be FOR ALL
-- TABLES; ignore the duplicate-object error so the migration stays idempotent.
do $$
begin
  alter publication supabase_realtime add table load_documents;
exception when duplicate_object then null;
end $$;
