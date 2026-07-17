-- Enable RLS on all operational tables.
alter table clients enable row level security;
alter table drivers enable row level security;
alter table units enable row level security;
alter table loads enable row level security;
alter table load_events enable row level security;
alter table messages enable row level security;
alter table pending_prompts enable row level security;
alter table app_settings enable row level security;

-- Authenticated office users may ONLY read. No insert/update/delete policies
-- exist, so those are denied. The server uses the service-role key, which
-- bypasses RLS entirely.
create policy office_read_clients on clients for select to authenticated using (true);
create policy office_read_drivers on drivers for select to authenticated using (true);
create policy office_read_units on units for select to authenticated using (true);
create policy office_read_loads on loads for select to authenticated using (true);
create policy office_read_events on load_events for select to authenticated using (true);
create policy office_read_messages on messages for select to authenticated using (true);
-- pending_prompts and app_settings are server-internal: no read policy → office cannot read them.
