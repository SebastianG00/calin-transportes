-- Driver profile fields: DNI (Peru national ID) + brevete (licence category + expiry).
-- Additive only; RLS from 0002 and table-level grants from 0003 already cover new columns.
alter table drivers add column if not exists dni text;
alter table drivers add column if not exists licencia_categoria text;
alter table drivers add column if not exists licencia_vence date;
