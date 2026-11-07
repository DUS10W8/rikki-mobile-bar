alter table public.orders
  add column handoff text check (handoff in ('outdoor_pickup', 'upstairs'));

alter table public.drink_checkouts
  add column handoff text check (handoff in ('outdoor_pickup', 'upstairs')),
  alter column table_number drop not null,
  add constraint drink_checkouts_handoff_required check (handoff is not null or table_number is not null);

create or replace function public.release_paid_drink(p_square_order_id text) returns void
language sql set search_path = '' as $$
  insert into public.orders (name, phone, drink, table_number, handoff, status, square_order_id)
  select name, phone, drink, table_number, handoff, 'New', square_order_id
  from public.drink_checkouts
  where square_order_id = p_square_order_id
  on conflict (square_order_id) do nothing;
$$;
