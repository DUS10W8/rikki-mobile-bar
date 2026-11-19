-- Inventory deduction on order.
--
-- Every paid order now carries structured lines (menu item + quantity). When the
-- server releases the paid order into the bartender queue, the same transaction
-- deducts each line's recipe from stock in an append-only ledger. Retries and
-- duplicate Square notifications never deduct twice (unique idempotency keys).
--
-- Stock on hand = sum of ledger deltas per SKU. Nothing ever edits a balance in place.
-- Units: liquids in US fluid ounces (fl_oz), solids by weight in ounces (oz_wt),
-- indivisible things in each. Packages (bottles, cans, kegs) convert via package_size.
--
-- Run this BEFORE deploying the matching api/ changes: the checkouts now write an
-- `items` column that only exists after this migration.

-- ── Catalog ──────────────────────────────────────────────────────────────────
create table public.inventory_items (
  sku text primary key check (sku ~ '^[a-z0-9-]+$'),
  name text not null,
  unit text not null check (unit in ('fl_oz', 'oz_wt', 'each')),
  package_size numeric(12,3) check (package_size > 0),   -- base units in one bottle/can/keg
  package_label text,                                     -- e.g. '750 mL bottle'
  low_stock_at numeric(12,3),                             -- warn at or below this many base units
  unit_cost_cents numeric(12,4) check (unit_cost_cents >= 0), -- cost of ONE base unit, in cents
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Base units of each SKU consumed by ONE serving of a menu item.
-- menu_item_id matches the ids in src/order/*.json (e.g. 'salsa-lunazul-margarita').
create table public.recipe_lines (
  menu_item_id text not null,
  sku text not null references public.inventory_items(sku),
  quantity numeric(12,3) not null check (quantity > 0),
  primary key (menu_item_id, sku)
);

-- ── Structured order lines ───────────────────────────────────────────────────
create table public.order_lines (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id text not null,
  name text not null,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  unique (order_id, menu_item_id)
);

alter table public.drink_checkouts add column if not exists items jsonb;
alter table public.walkup_checkouts add column if not exists items jsonb;

-- ── Ledger ───────────────────────────────────────────────────────────────────
create table public.inventory_ledger (
  id bigserial primary key,
  sku text not null references public.inventory_items(sku),
  delta numeric(12,3) not null check (delta <> 0 or reason = 'count_adjust'),  -- negative = stock out
  reason text not null check (reason in
    ('opening', 'receive', 'sale', 'void', 'waste', 'comp', 'count_adjust', 'transfer_in', 'transfer_out')),
  order_id uuid references public.orders(id) on delete set null,
  idempotency_key text not null unique,
  note text,
  actor text,
  occurred_at timestamptz not null default now()
);
create index inventory_ledger_sku_idx on public.inventory_ledger (sku);
create index inventory_ledger_order_idx on public.inventory_ledger (order_id);

create function public.inventory_ledger_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'inventory_ledger is append-only; post a correcting entry instead';
end $$;
create trigger inventory_ledger_append_only before update or delete on public.inventory_ledger
for each row execute function public.inventory_ledger_append_only();

-- Ordered items with no recipe (e.g. a new menu item). Stock is NOT guessed;
-- the line lands here so a manager can map it and post a correction.
create table public.inventory_exceptions (
  id bigserial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id text not null,
  quantity integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (order_id, menu_item_id)
);

-- ── Deduction ────────────────────────────────────────────────────────────────
create function public.record_order_lines(p_order_id uuid, p_items jsonb) returns void
language sql set search_path = '' as $$
  insert into public.order_lines (order_id, menu_item_id, name, quantity, unit_price_cents)
  select p_order_id, x.id, x.name, x.quantity, x.price_cents
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as x(id text, name text, quantity integer, price_cents integer)
  where x.id is not null
  on conflict (order_id, menu_item_id) do nothing;
$$;

create function public.apply_order_inventory(p_order_id uuid) returns void
language plpgsql set search_path = '' as $$
begin
  insert into public.inventory_ledger (sku, delta, reason, order_id, idempotency_key, note)
  select r.sku, -(r.quantity * l.quantity), 'sale', l.order_id,
         'sale:' || l.order_id || ':' || l.menu_item_id || ':' || r.sku,
         l.quantity || ' × ' || l.name
  from public.order_lines l
  join public.recipe_lines r on r.menu_item_id = l.menu_item_id
  where l.order_id = p_order_id
  on conflict (idempotency_key) do nothing;

  insert into public.inventory_exceptions (order_id, menu_item_id, quantity, reason)
  select l.order_id, l.menu_item_id, l.quantity, 'No recipe mapped; stock was not deducted.'
  from public.order_lines l
  where l.order_id = p_order_id
    and not exists (select 1 from public.recipe_lines r where r.menu_item_id = l.menu_item_id)
  on conflict (order_id, menu_item_id) do nothing;
end $$;

-- QR orders: release the paid ticket, record its lines and deduct, all at once.
create or replace function public.release_paid_drink(p_square_order_id text) returns void
language plpgsql set search_path = '' as $$
declare
  v_order uuid;
begin
  insert into public.orders (name, phone, drink, table_number, handoff, status, square_order_id)
  select name, phone, drink, table_number, handoff, 'New', square_order_id
  from public.drink_checkouts
  where square_order_id = p_square_order_id
  on conflict (square_order_id) do nothing
  returning id into v_order;

  if v_order is null then return; end if;  -- already released earlier: already deducted

  perform public.record_order_lines(v_order,
    (select items from public.drink_checkouts where square_order_id = p_square_order_id));
  perform public.apply_order_inventory(v_order);
end $$;

-- Walk-up orders: same, inside the existing payment-locked release.
create or replace function public.release_paid_walkup(p_id uuid, p_payment_id text, p_amount_cents integer)
returns boolean language plpgsql set search_path = '' as $$
declare
  checkout public.walkup_checkouts%rowtype;
  v_order uuid;
begin
  select * into checkout from public.walkup_checkouts where id = p_id for update;
  if not found or checkout.amount_cents <> p_amount_cents then return false; end if;
  if checkout.status = 'paid' then return checkout.payment_id = p_payment_id; end if;
  if checkout.status <> 'opened' then return false; end if;

  update public.walkup_checkouts set payment_id = p_payment_id, status = 'paid' where id = p_id;
  insert into public.orders (name, phone, drink, status, square_order_id)
  values (checkout.name, '', checkout.drink, 'New', 'walkup:' || p_id::text)
  returning id into v_order;

  perform public.record_order_lines(v_order, checkout.items);
  perform public.apply_order_inventory(v_order);
  return true;
end $$;

-- Paid but cancelled BEFORE anyone started making it: put the stock back.
-- Once a drink is started, made or served, depletion stands (refunds are money-only).
create function public.void_order_inventory(p_order_id uuid, p_reason text, p_actor text) returns integer
language plpgsql set search_path = '' as $$
declare
  v_status text;
  v_count integer;
begin
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if lower(v_status) <> 'new' then
    raise exception 'Order is already %; record waste instead of voiding', v_status;
  end if;
  if coalesce(trim(p_reason), '') = '' or coalesce(trim(p_actor), '') = '' then
    raise exception 'Reason and actor are required';
  end if;

  insert into public.inventory_ledger (sku, delta, reason, order_id, idempotency_key, note, actor)
  select s.sku, -s.delta, 'void', s.order_id, 'void:' || s.id, p_reason, p_actor
  from public.inventory_ledger s
  where s.order_id = p_order_id and s.reason = 'sale'
  on conflict (idempotency_key) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ── Manager stock movements ──────────────────────────────────────────────────
-- Receiving, waste, comps and transfers. p_key makes a retry safe (same key = same entry).
create function public.record_stock_movement(
  p_sku text, p_delta numeric, p_reason text, p_key text, p_note text, p_actor text
) returns void language plpgsql set search_path = '' as $$
begin
  if p_reason not in ('opening', 'receive', 'waste', 'comp', 'transfer_in', 'transfer_out') then
    raise exception 'Use record_stock_movement for opening, receive, waste, comp or transfers';
  end if;
  if p_reason in ('waste', 'comp', 'transfer_out') and p_delta >= 0 then
    raise exception '% must be a negative quantity', p_reason;
  end if;
  if p_reason in ('opening', 'receive', 'transfer_in') and p_delta <= 0 then
    raise exception '% must be a positive quantity', p_reason;
  end if;
  if coalesce(trim(p_key), '') = '' or coalesce(trim(p_actor), '') = '' then
    raise exception 'Idempotency key and actor are required';
  end if;
  insert into public.inventory_ledger (sku, delta, reason, idempotency_key, note, actor)
  values (p_sku, p_delta, p_reason, p_key, p_note, p_actor)
  on conflict (idempotency_key) do nothing;
end $$;

-- Physical count: posts (counted − expected) as an adjustment and returns the variance.
-- A negative variance is a shortage. The original ledger is never rewritten.
create function public.record_stock_count(
  p_sku text, p_counted numeric, p_key text, p_note text, p_actor text
) returns numeric language plpgsql set search_path = '' as $$
declare
  v_expected numeric;
  v_variance numeric;
begin
  if p_counted < 0 or coalesce(trim(p_key), '') = '' or coalesce(trim(p_actor), '') = '' then
    raise exception 'Count, idempotency key and actor are required';
  end if;
  perform 1 from public.inventory_items where sku = p_sku for update;  -- serialize counts per SKU
  if not found then raise exception 'Unknown SKU %', p_sku; end if;

  select l.delta into v_variance from public.inventory_ledger l where l.idempotency_key = p_key;
  if found then return v_variance; end if;   -- retried count: same answer, no second entry

  select coalesce(sum(delta), 0) into v_expected from public.inventory_ledger where sku = p_sku;
  v_variance := p_counted - v_expected;
  -- Zero-variance counts are kept too, so every count is on record.
  insert into public.inventory_ledger (sku, delta, reason, idempotency_key, note, actor)
  values (p_sku, v_variance, 'count_adjust', p_key,
          concat_ws(' · ', 'expected ' || v_expected || ', counted ' || p_counted, p_note), p_actor);
  return v_variance;
end $$;

-- ── Read views ───────────────────────────────────────────────────────────────
create view public.inventory_on_hand with (security_invoker = on) as
select i.sku, i.name, i.unit,
       coalesce(sum(l.delta), 0) as on_hand,
       case when i.package_size is not null
            then round(coalesce(sum(l.delta), 0) / i.package_size, 2) end as packages,
       i.package_label,
       coalesce(sum(l.delta) filter (where l.reason in ('sale', 'void')), 0) * -1 as sold_total,  -- net of voids
       coalesce(sum(l.delta), 0) <= coalesce(i.low_stock_at, 0) as low,
       i.unit_cost_cents,
       round(coalesce(sum(l.delta) filter (where l.reason in ('sale', 'void')), 0) * -1 * i.unit_cost_cents) as used_cost_cents,
       round(coalesce(sum(l.delta) filter (where l.reason in ('waste', 'comp')), 0) * -1 * i.unit_cost_cents) as waste_cost_cents
from public.inventory_items i
left join public.inventory_ledger l on l.sku = i.sku
where i.active
group by i.sku;

-- Supply cost per order (only SKUs with a unit cost entered), net of voids.
create view public.order_supply_cost with (security_invoker = on) as
select l.order_id,
       round(sum(-l.delta * i.unit_cost_cents)) as cost_cents,
       count(*) filter (where i.unit_cost_cents is null) as uncosted_entries
from public.inventory_ledger l
join public.inventory_items i on i.sku = l.sku
where l.order_id is not null and l.reason in ('sale', 'void')
group by l.order_id;

-- How many more of each menu item the current stock covers, if nothing else sold.
-- Shared ingredients mean these can't all be served at once.
create view public.menu_servings_left with (security_invoker = on) as
select r.menu_item_id,
       greatest(min(floor(h.on_hand / r.quantity)), 0)::integer as servings_left,
       (array_agg(r.sku order by h.on_hand / r.quantity))[1] as limiting_sku
from public.recipe_lines r
join public.inventory_on_hand h on h.sku = r.sku
group by r.menu_item_id;

-- ── Access: server (service role) writes; team members can read and run counts ─
do $$ declare t text; begin
  foreach t in array array['inventory_items', 'recipe_lines', 'order_lines', 'inventory_ledger', 'inventory_exceptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;
grant usage on all sequences in schema public to service_role;

do $$ begin
  if exists (select 1 from pg_proc where proname = 'is_team_member') then
    execute 'grant select on public.inventory_items, public.recipe_lines, public.order_lines, public.inventory_ledger, public.inventory_exceptions to authenticated';
    execute 'create policy team_read on public.inventory_items for select to authenticated using (public.is_team_member())';
    execute 'create policy team_read on public.recipe_lines for select to authenticated using (public.is_team_member())';
    execute 'create policy team_read on public.order_lines for select to authenticated using (public.is_team_member())';
    execute 'create policy team_read on public.inventory_ledger for select to authenticated using (public.is_team_member())';
    execute 'create policy team_read on public.inventory_exceptions for select to authenticated using (public.is_team_member())';
  end if;
end $$;

revoke all on function public.record_order_lines(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.apply_order_inventory(uuid) from public, anon, authenticated;
revoke all on function public.void_order_inventory(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_stock_movement(text, numeric, text, text, text, text) from public, anon, authenticated;
revoke all on function public.record_stock_count(text, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.record_order_lines(uuid, jsonb) to service_role;
grant execute on function public.apply_order_inventory(uuid) to service_role;
grant execute on function public.void_order_inventory(uuid, text, text) to service_role;
grant execute on function public.record_stock_movement(text, numeric, text, text, text, text) to service_role;
grant execute on function public.record_stock_count(text, numeric, text, text, text) to service_role;
revoke all on function public.release_paid_drink(text) from public, anon, authenticated;
grant execute on function public.release_paid_drink(text) to service_role;
revoke all on function public.release_paid_walkup(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.release_paid_walkup(uuid, text, integer) to service_role;
