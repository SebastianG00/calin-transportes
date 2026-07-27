-- Per-unit operational logs: fuel/expenses and maintenance/wash.
-- Additive; RLS read-only (frontend), service-role is the only writer.
create table unit_expenses (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  fecha date not null,
  tipo text not null check (tipo in ('combustible', 'gasto')),
  galones numeric,               -- only for tipo='combustible'
  monto numeric not null,
  driver_id uuid references drivers(id),
  nota text,
  created_at timestamptz not null default now()
);
create index unit_expenses_unit_id_idx on unit_expenses (unit_id);

create table unit_maintenance (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  fecha date not null,
  tipo text not null check (tipo in ('mantenimiento', 'lavado')),
  detalle text,
  costo numeric,
  created_at timestamptz not null default now()
);
create index unit_maintenance_unit_id_idx on unit_maintenance (unit_id);

-- RLS: authenticated can read; no write policy → only the service-role key writes.
alter table unit_expenses enable row level security;
alter table unit_maintenance enable row level security;
create policy office_read_unit_expenses on unit_expenses for select to authenticated using (true);
create policy office_read_unit_maintenance on unit_maintenance for select to authenticated using (true);
