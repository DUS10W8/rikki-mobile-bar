-- Cash register: shifts, an append-only drawer ledger, cash tenders and closeout.
--
-- Money is integer cents everywhere. The drawer balance is never stored: expected cash
-- = sum of drawer_entries for the shift. Every write takes an idempotency key, so a
-- double tap or a retry after a dropped connection returns the first result.
--
-- One walk-up checkout gets exactly one tender: Square card (existing flow) or cash.
-- Cash sales never touch Square, so each sale appears once: card in Square, cash here.
--
-- Run BEFORE deploying the matching api/ changes.

-- ── Walk-up checkout gains tax, total and tender ───────────────────────────────
alter table public.walkup_checkouts
  add column if not exists tax_cents integer check (tax_cents >= 0),        -- null = tax rule unavailable at ring-up
  add column if not exists tax_basis_points integer check (tax_basis_points >= 0),
  add column if not exists tender text check (tender in ('card', 'cash')),
  add column if not exists cash_received_cents integer,
  add column if not exists change_cents integer,
  add column if not exists shift_id uuid,
  add column if not exists operator text,
  add column if not exists order_id uuid,
  add column if not exists paid_at timestamptz;

-- ── Shifts (one cash drawer each) ─────────────────────────────────────────────
create table public.cash_shifts (
  id uuid primary key default gen_random_uuid(),
  drawer text not null default 'main' check (drawer ~ '^[a-z0-9-]{1,30}$'),
  event_label text not null check (length(event_label) between 1 and 80),
  opened_by text not null check (length(opened_by) between 1 and 60),
  opened_at timestamptz not null default now(),
  opening_float_cents integer not null check (opening_float_cents >= 0),
  closed_at timestamptz,
  open_key text not null unique
);
-- Only one open shift per physical drawer.
create unique index cash_shifts_one_open on public.cash_shifts (drawer) where closed_at is null;

alter table public.walkup_checkouts
  add constraint walkup_checkouts_shift_fk foreign key (shift_id) references public.cash_shifts(id);

create table public.drawer_entries (
  id bigserial primary key,
  shift_id uuid not null references public.cash_shifts(id),
  kind text not null check (kind in ('float', 'sale', 'refund', 'paid_in', 'payout', 'drop')),
  amount_cents integer not null,                       -- signed: + into drawer, − out of drawer
  walkup_id uuid references public.walkup_checkouts(id),
  order_id uuid references public.orders(id) on delete set null,
  reason text,
  actor text not null,
  idempotency_key text not null unique,
  occurred_at timestamptz not null default now(),
  check ((kind in ('float', 'sale', 'paid_in') and amount_cents > 0)
      or (kind in ('refund', 'payout', 'drop') and amount_cents < 0))
);
create index drawer_entries_shift_idx on public.drawer_entries (shift_id);

-- Closing counts. The first close ends the shift; later rows are corrections that
-- point at the row they supersede. Nothing is edited in place.
create table public.drawer_counts (
  id bigserial primary key,
  shift_id uuid not null references public.cash_shifts(id),
  denominations jsonb not null,                        -- {"10000": 1, "2000": 1, "100": 3, ...} cents → count
  counted_cents integer not null,
  expected_cents integer not null,
  variance_cents integer not null,                     -- counted − expected; negative = short
  supersedes bigint references public.drawer_counts(id),
  reason text,
  actor text not null,
  idempotency_key text not null unique,
  counted_at timestamptz not null default now()
);

create function public.cash_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only; record a correcting entry instead', tg_table_name;
end $$;
create trigger drawer_entries_append_only before update or delete on public.drawer_entries
for each row execute function public.cash_append_only();
create trigger drawer_counts_append_only before update or delete on public.drawer_counts
for each row execute function public.cash_append_only();

create function public.shift_expected_cents(p_shift uuid) returns integer
language sql stable set search_path = '' as $$
  select coalesce(sum(amount_cents), 0)::integer from public.drawer_entries where shift_id = p_shift;
$$;

-- ── Open a shift ──────────────────────────────────────────────────────────────
create function public.open_cash_shift(
  p_drawer text, p_event_label text, p_float_cents integer, p_actor text, p_key text
) returns uuid language plpgsql set search_path = '' as $$
declare
  v_shift uuid;
begin
  select id into v_shift from public.cash_shifts where open_key = p_key;
  if found then return v_shift; end if;
  if p_float_cents is null or p_float_cents < 0 then raise exception 'Opening float must be zero or more'; end if;

  insert into public.cash_shifts (drawer, event_label, opened_by, opening_float_cents, open_key)
  values (p_drawer, trim(p_event_label), trim(p_actor), p_float_cents, p_key)
  returning id into v_shift;
  if p_float_cents > 0 then
    insert into public.drawer_entries (shift_id, kind, amount_cents, reason, actor, idempotency_key)
    values (v_shift, 'float', p_float_cents, 'Opening float', trim(p_actor), 'float:' || v_shift);
  end if;
  return v_shift;
exception when unique_violation then
  raise exception 'This drawer already has an open shift. Close it before opening another.';
end $$;

-- ── Cash sale: tender + drawer + ticket + inventory in one transaction ─────────
create function public.pay_walkup_cash(
  p_id uuid, p_shift uuid, p_expected_total_cents integer, p_received_cents integer, p_actor text
) returns jsonb language plpgsql set search_path = '' as $$
declare
  c public.walkup_checkouts%rowtype;
  v_total integer;
  v_order uuid;
begin
  select * into c from public.walkup_checkouts where id = p_id for update;
  if not found then raise exception 'Walk-up order not found'; end if;

  -- Repeat of a completed cash sale: return the original result unchanged.
  if c.status = 'paid' and c.tender = 'cash' then
    return jsonb_build_object('order_id', c.order_id, 'total_cents', c.amount_cents + c.tax_cents,
      'received_cents', c.cash_received_cents, 'change_cents', c.change_cents, 'repeat', true);
  end if;
  if c.status = 'paid' then raise exception 'This order was already paid by card'; end if;
  if c.status = 'opened' then
    raise exception 'A Square card attempt is still open for this order. Find or clear the Square payment before taking cash.';
  end if;
  if c.status <> 'waiting' then raise exception 'This order was cancelled'; end if;
  if c.tax_cents is null then raise exception 'Tax could not be calculated for this order. Ring it again.'; end if;

  v_total := c.amount_cents + c.tax_cents;
  if p_expected_total_cents is distinct from v_total then
    raise exception 'The total changed. Refresh before taking cash.';
  end if;
  if p_received_cents is null or p_received_cents < v_total then
    raise exception 'Cash received is less than the amount due';
  end if;
  if p_received_cents > 100000 then raise exception 'Cash received looks wrong (over $1,000)'; end if;
  perform 1 from public.cash_shifts where id = p_shift and closed_at is null;
  if not found then raise exception 'Open the cash drawer before taking cash'; end if;

  insert into public.orders (name, phone, drink, status, square_order_id)
  values (c.name, '', c.drink, 'New', 'cash:' || p_id::text)
  returning id into v_order;

  update public.walkup_checkouts
     set status = 'paid', tender = 'cash', cash_received_cents = p_received_cents,
         change_cents = p_received_cents - v_total, shift_id = p_shift, operator = trim(p_actor),
         order_id = v_order, paid_at = now()
   where id = p_id;

  insert into public.drawer_entries (shift_id, kind, amount_cents, walkup_id, order_id, reason, actor, idempotency_key)
  values (p_shift, 'sale', v_total, p_id, v_order, 'Cash sale', trim(p_actor), 'sale:' || p_id);

  perform public.record_order_lines(v_order, c.items);
  perform public.apply_order_inventory(v_order);

  return jsonb_build_object('order_id', v_order, 'total_cents', v_total, 'received_cents', p_received_cents,
    'change_cents', p_received_cents - v_total, 'repeat', false);
end $$;

-- Card path: remember the tender and the ticket it released (existing logic otherwise unchanged).
create or replace function public.release_paid_walkup(p_id uuid, p_payment_id text, p_amount_cents integer)
returns boolean language plpgsql set search_path = '' as $$
declare
  checkout public.walkup_checkouts%rowtype;
  v_order uuid;
begin
  select * into checkout from public.walkup_checkouts where id = p_id for update;
  if not found or checkout.amount_cents <> p_amount_cents then return false; end if;
  if checkout.status = 'paid' then return checkout.tender is distinct from 'cash' and checkout.payment_id = p_payment_id; end if;
  if checkout.status <> 'opened' then return false; end if;

  insert into public.orders (name, phone, drink, status, square_order_id)
  values (checkout.name, '', checkout.drink, 'New', 'walkup:' || p_id::text)
  returning id into v_order;
  update public.walkup_checkouts
     set payment_id = p_payment_id, status = 'paid', tender = 'card', order_id = v_order, paid_at = now()
   where id = p_id;

  perform public.record_order_lines(v_order, checkout.items);
  perform public.apply_order_inventory(v_order);
  return true;
end $$;

-- ── Refunds, paid-ins, payouts, drops ─────────────────────────────────────────
-- A cash refund records money leaving the drawer. Product disposition is separate:
-- poured/eaten stays depleted; a sealed item put back is a record_stock_movement.
create function public.refund_walkup_cash(
  p_id uuid, p_shift uuid, p_amount_cents integer, p_reason text, p_actor text, p_key text
) returns integer language plpgsql set search_path = '' as $$
declare
  c public.walkup_checkouts%rowtype;
  v_refunded integer;
begin
  if exists (select 1 from public.drawer_entries where idempotency_key = p_key) then
    return (select -amount_cents from public.drawer_entries where idempotency_key = p_key);
  end if;
  select * into c from public.walkup_checkouts where id = p_id for update;
  if not found or c.status <> 'paid' or c.tender <> 'cash' then
    raise exception 'Only a paid cash sale can get a cash refund. Refund card sales in Square.';
  end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A refund needs a reason'; end if;
  perform 1 from public.cash_shifts where id = p_shift and closed_at is null;
  if not found then raise exception 'Open the cash drawer before refunding'; end if;
  select coalesce(-sum(amount_cents), 0) into v_refunded from public.drawer_entries
   where walkup_id = p_id and kind = 'refund';
  if p_amount_cents is null or p_amount_cents <= 0 or v_refunded + p_amount_cents > c.amount_cents + c.tax_cents then
    raise exception 'Refund is more than what was paid (% cents already refunded)', v_refunded;
  end if;
  insert into public.drawer_entries (shift_id, kind, amount_cents, walkup_id, order_id, reason, actor, idempotency_key)
  values (p_shift, 'refund', -p_amount_cents, p_id, c.order_id, trim(p_reason), trim(p_actor), p_key);
  return p_amount_cents;
end $$;

create function public.record_drawer_movement(
  p_shift uuid, p_kind text, p_amount_cents integer, p_reason text, p_actor text, p_key text
) returns void language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.drawer_entries where idempotency_key = p_key) then return; end if;
  if p_kind not in ('paid_in', 'payout', 'drop') then raise exception 'Use paid_in, payout or drop'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'Enter an amount above zero'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  perform 1 from public.cash_shifts where id = p_shift and closed_at is null;
  if not found then raise exception 'That shift is closed'; end if;
  insert into public.drawer_entries (shift_id, kind, amount_cents, reason, actor, idempotency_key)
  values (p_shift, p_kind, case when p_kind = 'paid_in' then p_amount_cents else -p_amount_cents end,
          trim(p_reason), trim(p_actor), p_key);
end $$;

-- ── Close (or correct a close) by denomination ────────────────────────────────
create function public.close_cash_shift(
  p_shift uuid, p_denominations jsonb, p_reason text, p_actor text, p_key text
) returns jsonb language plpgsql set search_path = '' as $$
declare
  v_counted integer;
  v_expected integer;
  v_previous bigint;
  v_row public.drawer_counts%rowtype;
begin
  select * into v_row from public.drawer_counts where idempotency_key = p_key;
  if found then
    return jsonb_build_object('count_id', v_row.id, 'counted_cents', v_row.counted_cents,
      'expected_cents', v_row.expected_cents, 'variance_cents', v_row.variance_cents);
  end if;
  perform 1 from public.cash_shifts where id = p_shift for update;
  if not found then raise exception 'Shift not found'; end if;

  select coalesce(sum((d.key)::integer * (d.value)::integer), 0) into v_counted
  from jsonb_each_text(coalesce(p_denominations, '{}'::jsonb)) d
  where d.key in ('10000','5000','2000','1000','500','200','100','25','10','5','1')
    and (d.value)::integer >= 0;
  if (select count(*) from jsonb_each_text(coalesce(p_denominations, '{}'::jsonb)) d
      where d.key not in ('10000','5000','2000','1000','500','200','100','25','10','5','1')
         or (d.value)::integer < 0) > 0 then
    raise exception 'Unknown denomination or negative count';
  end if;

  v_expected := public.shift_expected_cents(p_shift);
  select id into v_previous from public.drawer_counts where shift_id = p_shift order by id desc limit 1;
  if v_previous is not null and coalesce(trim(p_reason), '') = '' then
    raise exception 'This drawer was already closed. A recount needs a reason.';
  end if;

  insert into public.drawer_counts (shift_id, denominations, counted_cents, expected_cents, variance_cents,
                                    supersedes, reason, actor, idempotency_key)
  values (p_shift, p_denominations, v_counted, v_expected, v_counted - v_expected,
          v_previous, nullif(trim(p_reason), ''), trim(p_actor), p_key)
  returning * into v_row;
  update public.cash_shifts set closed_at = coalesce(closed_at, now()) where id = p_shift;

  return jsonb_build_object('count_id', v_row.id, 'counted_cents', v_counted,
    'expected_cents', v_expected, 'variance_cents', v_counted - v_expected);
end $$;

-- ── Reports ───────────────────────────────────────────────────────────────────
create view public.cash_shift_summary with (security_invoker = on) as
select s.id as shift_id, s.drawer, s.event_label, s.opened_by, s.opened_at, s.closed_at,
       s.opening_float_cents,
       coalesce(sum(e.amount_cents) filter (where e.kind = 'sale'), 0) as cash_sales_cents,
       coalesce(sum(e.amount_cents) filter (where e.kind = 'refund'), 0) as cash_refunds_cents,
       coalesce(sum(e.amount_cents) filter (where e.kind = 'paid_in'), 0) as paid_in_cents,
       coalesce(sum(e.amount_cents) filter (where e.kind = 'payout'), 0) as payouts_cents,
       coalesce(sum(e.amount_cents) filter (where e.kind = 'drop'), 0) as drops_cents,
       coalesce(sum(e.amount_cents), 0) as expected_cents,
       (select c.counted_cents from public.drawer_counts c where c.shift_id = s.id order by c.id desc limit 1) as counted_cents,
       (select c.variance_cents from public.drawer_counts c where c.shift_id = s.id order by c.id desc limit 1) as over_short_cents
from public.cash_shifts s
left join public.drawer_entries e on e.shift_id = s.id
group by s.id;

-- Every paid walk-up sale exactly once, with its tender. Card rows reconcile to Square;
-- cash rows reconcile to the drawer. QR orders are card-only and live in Square.
create view public.walkup_sales with (security_invoker = on) as
select w.id as walkup_id, w.order_id, w.paid_at, w.tender, w.shift_id, w.operator,
       w.amount_cents as subtotal_cents, w.tax_cents,
       case when w.tender = 'cash' then w.amount_cents + w.tax_cents end as cash_collected_cents,
       w.payment_id as square_payment_id, w.drink
from public.walkup_checkouts w
where w.status = 'paid';

-- ── Access: server only (service role) ────────────────────────────────────────
do $$ declare t text; begin
  foreach t in array array['cash_shifts', 'drawer_entries', 'drawer_counts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;
revoke all on public.cash_shift_summary, public.walkup_sales from public, anon, authenticated;
grant select on public.cash_shift_summary, public.walkup_sales to service_role;
grant usage on all sequences in schema public to service_role;

do $$ declare f text; begin
  foreach f in array array[
    'public.shift_expected_cents(uuid)',
    'public.open_cash_shift(text, text, integer, text, text)',
    'public.pay_walkup_cash(uuid, uuid, integer, integer, text)',
    'public.release_paid_walkup(uuid, text, integer)',
    'public.refund_walkup_cash(uuid, uuid, integer, text, text, text)',
    'public.record_drawer_movement(uuid, text, integer, text, text, text)',
    'public.close_cash_shift(uuid, jsonb, text, text, text)',
    'public.cash_append_only()'] loop
    execute 'revoke all on function ' || f || ' from public, anon, authenticated';
    execute 'grant execute on function ' || f || ' to service_role';
  end loop;
end $$;
