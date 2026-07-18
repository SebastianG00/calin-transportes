-- Master-data fields surfaced in the Conductores/Unidades tables.
alter table drivers add column if not exists email text;
alter table units add column if not exists tipo text;
