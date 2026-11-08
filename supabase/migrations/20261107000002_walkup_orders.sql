create table public.walkup_checkouts (
  id uuid primary key,
  name text not null,
  drink text not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  status text not null default 'waiting' check (status in ('waiting', 'opened', 'paid', 'cancelled')),
  payment_id text unique
);

alter table public.walkup_checkouts enable row level security;
revoke all on public.walkup_checkouts from public, anon, authenticated;
grant select, insert, update on public.walkup_checkouts to service_role;

create function public.release_paid_walkup(p_id uuid, p_payment_id text, p_amount_cents integer)
returns boolean language plpgsql set search_path = '' as $$
declare
  checkout public.walkup_checkouts%rowtype;
begin
  select * into checkout from public.walkup_checkouts where id = p_id for update;
  if not found or checkout.amount_cents <> p_amount_cents then return false; end if;
  if checkout.status = 'paid' then return checkout.payment_id = p_payment_id; end if;
  if checkout.status <> 'opened' then return false; end if;

  update public.walkup_checkouts set payment_id = p_payment_id, status = 'paid' where id = p_id;
  insert into public.orders (name, phone, drink, status, square_order_id)
  values (checkout.name, '', checkout.drink, 'New', 'walkup:' || p_id::text);
  return true;
end;
$$;

revoke all on function public.release_paid_walkup(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.release_paid_walkup(uuid, text, integer) to service_role;
