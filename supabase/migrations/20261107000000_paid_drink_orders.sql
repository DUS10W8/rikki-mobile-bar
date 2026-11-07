alter table public.orders add column if not exists square_order_id text unique;

-- Only the server may release tickets. Existing staff status updates still work.
revoke insert on public.orders from public, anon, authenticated;

create function public.protect_order_payment() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.square_order_id is distinct from old.square_order_id then
    raise exception 'Payment reference cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_order_payment before update on public.orders
for each row execute function public.protect_order_payment();

create table public.drink_checkouts (
  id uuid primary key,
  square_order_id text not null unique,
  name text not null,
  phone text not null,
  drink text not null,
  table_number smallint not null check (table_number between 1 and 12),
  amount_cents integer not null check (amount_cents > 0)
);

alter table public.drink_checkouts enable row level security;
revoke all on public.drink_checkouts from public, anon, authenticated;
grant select, insert on public.drink_checkouts to service_role;

create function public.release_paid_drink(p_square_order_id text) returns void
language sql set search_path = '' as $$
  insert into public.orders (name, phone, drink, table_number, status, square_order_id)
  select name, phone, drink, table_number, 'New', square_order_id
  from public.drink_checkouts
  where square_order_id = p_square_order_id
  on conflict (square_order_id) do nothing;
$$;

revoke all on function public.release_paid_drink(text) from public, anon, authenticated;
grant execute on function public.release_paid_drink(text) to service_role;
