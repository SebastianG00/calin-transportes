-- Office tasks. RLS read-only (frontend), service-role is the only writer.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null check (categoria in ('Carga','Cobro','Mantenimiento','Cliente','Otro')),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','hecho')),
  prioridad text not null default 'normal' check (prioridad in ('critica','importante','normal')),
  fecha_vencimiento date,                 -- nullable; drives the calendar
  load_id uuid references loads(id),      -- optional link
  client_id uuid references clients(id),  -- optional link
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_estado_idx on tasks (estado);

alter table tasks enable row level security;
create policy office_read_tasks on tasks for select to authenticated using (true);

-- Realtime for the live list. supabase_realtime may already be FOR ALL TABLES; guard.
do $$ begin
  alter publication supabase_realtime add table tasks;
exception when duplicate_object then null; when others then null; end $$;
