-- Fleet parts inventory. RLS read-only (frontend), service-role is the only writer.
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('Llantas','Lubricantes','Filtros','Repuestos','Otros')),
  unidad_medida text not null default 'unidad',
  stock_minimo numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  tipo text not null check (tipo in ('entrada','salida')),
  cantidad numeric not null check (cantidad > 0),
  unit_id uuid references units(id),          -- optional link (salida → truck)
  motivo text,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);
create index inventory_movements_item_idx on inventory_movements (item_id);

alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
create policy office_read_inventory_items on inventory_items for select to authenticated using (true);
create policy office_read_inventory_movements on inventory_movements for select to authenticated using (true);
