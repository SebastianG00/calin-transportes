-- Spec 1: Client documents & profiles.
-- requirement_clauses: reusable requirement "clauses" (global when client_id is
--   null, else per-client). bucket = how it's verified: 'reconcile' (vs load
--   data), 'verify' (vs the returned photo — Spec 2), 'attest' (human checkbox).
--   source tags who authored it ('human' | 'ai'); every ai clause is reviewed by
--   a human before save. params carries a small structured payload (e.g.
--   {"max_peso_kg": 9000}); a full policy engine is a later slice.
-- document_templates: reusable guía / email templates with {{placeholders}} and,
--   for guías, a {{requisitos}} marker where the composed clauses render.
-- delivery_guias: one immutable snapshot per generated pre-trip guía (audit +
--   reproducibility). clauses/data are frozen JSON; html is the rendered artifact.
-- delivery_emails: AI-drafted post-delivery summary emails (draft -> sent).
create table requirement_clauses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),          -- null = global
  title text not null,
  body text not null,
  bucket text not null check (bucket in ('reconcile','verify','attest')),
  params jsonb not null default '{}'::jsonb,
  source text not null default 'human' check (source in ('human','ai')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requirement_clauses_client_idx on requirement_clauses (client_id, active);

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),          -- null = default template
  kind text not null check (kind in ('guia','email')),
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_templates_client_idx on document_templates (client_id, kind);

create table delivery_guias (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id),
  template_id uuid references document_templates(id),
  clauses jsonb not null default '[]'::jsonb,      -- snapshot: [{title,body,bucket}]
  data jsonb not null default '{}'::jsonb,          -- the filled trip values
  status text not null default 'draft' check (status in ('draft','approved')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  html text not null default '',                    -- rendered print-ready artifact
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_guias_load_idx on delivery_guias (load_id, created_at);

create table delivery_emails (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id),
  template_id uuid references document_templates(id),
  draft_text text not null default '',
  edited_text text,
  status text not null default 'draft' check (status in ('draft','sent')),
  created_by text not null default 'office',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_emails_load_idx on delivery_emails (load_id, created_at);

alter table clients add column if not exists contact_email text;

-- RLS: office reads only; the server (service-role) bypasses RLS to write.
alter table requirement_clauses enable row level security;
alter table document_templates enable row level security;
alter table delivery_guias enable row level security;
alter table delivery_emails enable row level security;
create policy office_read_clauses on requirement_clauses for select to authenticated using (true);
create policy office_read_templates on document_templates for select to authenticated using (true);
create policy office_read_guias on delivery_guias for select to authenticated using (true);
create policy office_read_emails on delivery_emails for select to authenticated using (true);

-- Realtime for the guía builder. supabase_realtime may already be FOR ALL
-- TABLES; ignore the duplicate-object error so the migration stays idempotent.
do $$
begin
  alter publication supabase_realtime add table delivery_guias;
exception when duplicate_object then null;
end $$;
