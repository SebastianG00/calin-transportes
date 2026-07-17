-- Step A: flag overdue sent loads; returns the rows this call won.
create or replace function claim_no_response()
returns table(id uuid, assigned_driver_id uuid, cargo_description text, destination text)
language sql as $$
  update loads set no_response = true, updated_at = now()
  where status = 'sent' and confirm_due_at < now() and no_response = false
  returning id, assigned_driver_id, cargo_description, destination;
$$;

-- Step B: claim-before-send for the reminder; returns rows to actually message.
create or replace function claim_reminder()
returns table(id uuid, assigned_driver_id uuid, cargo_description text, destination text)
language sql as $$
  update loads set reminder_sent_at = now(), updated_at = now()
  where status = 'sent' and no_response = true and reminder_sent_at is null
  returning id, assigned_driver_id, cargo_description, destination;
$$;

-- Manual remind: rate-limited claim-before-send.
create or replace function claim_manual_remind(p_load_id uuid, p_gap_minutes int)
returns table(id uuid, assigned_driver_id uuid, cargo_description text, destination text)
language sql as $$
  update loads set last_reminded_at = now(), updated_at = now()
  where id = p_load_id and status = 'sent'
    and (last_reminded_at is null or last_reminded_at < now() - make_interval(mins => p_gap_minutes))
  returning id, assigned_driver_id, cargo_description, destination;
$$;
