-- Close public access to guest orders.
--
-- Before this, the public (anon) key shipped in every page could read every order,
-- including guest names and phone numbers, and change any order's status.
-- The bartender board and guest tracker now go through server endpoints
-- (/api/bartender-orders and /api/drink-checkout?order=) that use the service role.
--
-- Run AFTER the matching site deploy is live; the previous site read orders directly.

drop policy if exists "public can read orders" on public.orders;
drop policy if exists "public can update orders" on public.orders;
drop policy if exists "public can insert orders" on public.orders;

revoke all on public.orders from public, anon, authenticated;
grant select, insert, update on public.orders to service_role;

alter table public.orders enable row level security;
-- No anon/authenticated policies remain: RLS denies everything except the service role.
