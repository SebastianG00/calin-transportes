create type load_status as enum
  ('unassigned','sent','confirmed','en_route','delivered','cancelled');
create type event_source as enum ('office','driver','timer','system');

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ruc char(11) not null,
  contact_name text,
  contact_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp_phone text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  capacity_kg numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table loads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  cargo_description text not null,
  weight_kg numeric not null,
  origin text not null,
  destination text not null,
  scheduled_date date not null,
  price numeric not null,
  currency text not null default 'PEN',
  status load_status not null default 'unassigned',
  no_response boolean not null default false,
  assigned_unit_id uuid references units(id),
  assigned_driver_id uuid references drivers(id),
  confirm_due_at timestamptz,
  reminder_sent_at timestamptz,
  last_reminded_at timestamptz,
  confirmed_at timestamptz,
  cancel_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ONE ACTIVE LOAD PER DRIVER
create unique index one_active_load_per_driver
  on loads (assigned_driver_id)
  where status in ('sent','confirmed','en_route');

create table load_events (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id),
  from_status load_status,
  to_status load_status,
  source event_source not null,
  actor text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index load_events_load_id_idx on load_events (load_id, created_at);

create table messages (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_message_sid text not null unique,
  direction text not null check (direction in ('in','out')),
  from_phone text,
  to_phone text,
  driver_id uuid references drivers(id),
  load_id uuid references loads(id),
  template_name text,
  body text,
  media_url text,
  media_storage_path text,
  status text,
  processed boolean not null default false,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);
create index messages_load_id_idx on messages (load_id, created_at);

create table pending_prompts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id),
  kind text not null,
  target_event_id uuid references load_events(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index pending_prompts_driver_idx on pending_prompts (driver_id, kind, expires_at);

create table app_settings (
  id int primary key default 1 check (id = 1),
  confirm_window_minutes int not null default 30,
  reminder_enabled boolean not null default true,
  manual_remind_min_gap_minutes int not null default 10
);
insert into app_settings (id) values (1);
