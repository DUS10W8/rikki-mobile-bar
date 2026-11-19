-- Salsa Night: one pickup point, the table across the bar-room doorway. No runner.
-- Adds 'doorway_pickup' to the allowed handoffs. Old values stay valid for past orders.
-- Run BEFORE deploying the matching site change (the site will start sending 'doorway_pickup').

do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('public.orders'::regclass, 'public.drink_checkouts'::regclass)
      and pg_get_constraintdef(c.oid) like '%outdoor_pickup%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_handoff_allowed
  check (handoff is null or handoff in ('doorway_pickup', 'outdoor_pickup', 'upstairs'));
alter table public.drink_checkouts add constraint drink_checkouts_handoff_allowed
  check (handoff is null or handoff in ('doorway_pickup', 'outdoor_pickup', 'upstairs'));
