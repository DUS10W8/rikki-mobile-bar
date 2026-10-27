-- Rikki's Mobile Bar + eBay Command Center
-- Shared, raw-first data model. Every external record keeps its source payload
-- and upserts on the source system's natural key, so re-syncs never duplicate.

create extension if not exists pgcrypto;

-- ── Access: only the two of us ────────────────────────────────────────────
create table if not exists team_members (
  email text primary key,
  display_name text not null,
  added_at timestamptz not null default now()
);

create or replace function is_team_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── Quotes: raw submissions exactly as the site sent them ───────────────────
create table if not exists quote_submissions (
  submission_id uuid primary key,              -- generated in the browser, also sent to Formspree
  received_at timestamptz not null default now(),
  origin text not null default 'site',          -- 'site' | 'formspree_backfill'
  formspree_submission_at timestamptz,          -- filled by backfill/reconcile
  name text, email text, phone text,
  event_date date, event_type text, service_type text,
  guest_count int, duration text,
  bar_tier text, bar_payment_model text,
  estimate_min numeric, estimate_max numeric,
  promo_code text,
  attribution jsonb not null default '{}'::jsonb,  -- referrer, utm_*, landing page
  payload jsonb not null,                          -- every field, untouched
  lead_id uuid
);
create index if not exists quote_submissions_received_idx on quote_submissions (received_at desc);
create index if not exists quote_submissions_email_idx on quote_submissions (lower(email));

-- ── Leads: the CRM pipeline ─────────────────────────────────────────────────
do $$ begin
  create type lead_stage as enum ('new','contacted','deposit','booked','done','lost');
exception when duplicate_object then null; end $$;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, email text, phone text,
  event_date date, event_type text,
  source text,                        -- derived from attribution (google, instagram, the knot, direct...)
  stage lead_stage not null default 'new',
  stage_changed_at timestamptz not null default now(),
  first_reply_at timestamptz,         -- speed-to-lead: set when stage leaves 'new'
  quoted_total numeric,
  lost_reason text,
  notes text
);
create index if not exists leads_stage_idx on leads (stage);

create table if not exists lead_stage_events (
  id bigserial primary key,
  lead_id uuid not null references leads(id) on delete cascade,
  from_stage lead_stage, to_stage lead_stage not null,
  changed_at timestamptz not null default now(),
  changed_by text
);

create or replace function track_lead_stage() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_stage_events (lead_id, from_stage, to_stage, changed_by)
    values (new.id, null, new.stage, auth.jwt() ->> 'email');
  elsif new.stage is distinct from old.stage then
    new.stage_changed_at := now();
    if old.stage = 'new' and new.first_reply_at is null then
      new.first_reply_at := now();
    end if;
    insert into lead_stage_events (lead_id, from_stage, to_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.jwt() ->> 'email');
  end if;
  return new;
end $$;
drop trigger if exists leads_stage_ins on leads;
create trigger leads_stage_ins after insert on leads for each row execute function track_lead_stage();
drop trigger if exists leads_stage_upd on leads;
create trigger leads_stage_upd before update on leads for each row execute function track_lead_stage();

-- ── Events: operations record (this system is the source of truth) ────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  event_date date not null,
  start_time time, end_time time,
  venue text, address text,
  travel_minutes int,                 -- one-way, for van turnaround conflicts
  headcount int,
  bar_tier text,
  staff_needed int,
  liquor_order_status text not null default 'not_started',   -- not_started | drafted | ordered | received
  liquor_order jsonb,
  permit_status text not null default 'unknown',             -- unknown | not_needed | applied | approved
  permit_ref text,
  contract_total numeric,
  calendar_event_id text unique,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists event_staff (
  event_id uuid not null references events(id) on delete cascade,
  staff_name text not null,
  role text not null default 'bartender',
  confirmed boolean not null default false,
  primary key (event_id, staff_name)
);

-- ── Payments (Square) ───────────────────────────────────────────────────────
create table if not exists payments (
  square_payment_id text primary key,
  created_at timestamptz not null,
  amount numeric not null,
  status text,
  buyer_email text,
  note text,
  lead_id uuid references leads(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  raw jsonb not null
);

-- ── eBay (read-only mirror, natural keys from eBay) ───────────────────────
create table if not exists ebay_orders (
  order_id text primary key,
  created_at timestamptz not null,
  ship_by timestamptz,
  fulfillment_status text,
  buyer_username text,
  total numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);

create table if not exists ebay_line_items (
  line_item_id text primary key,
  order_id text not null references ebay_orders(order_id) on delete cascade,
  item_id text, sku text, title text,
  quantity int, line_total numeric,
  item_cost numeric                       -- what we paid; null = not recorded (never treated as 0)
);

create table if not exists ebay_listings (
  item_id text primary key,
  sku text, title text,
  price numeric, quantity_available int,
  start_time timestamptz,
  watch_count int,
  item_cost numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);

create table if not exists ebay_finance_txns (
  transaction_id text primary key,
  transaction_type text not null,          -- SALE, REFUND, SHIPPING_LABEL, NON_SALE_CHARGE, ...
  transaction_date timestamptz not null,
  order_id text,
  amount numeric not null,                 -- signed net to us
  total_fee numeric,
  payout_id text,
  booking_entry text,
  raw jsonb not null
);
create index if not exists ebay_finance_payout_idx on ebay_finance_txns (payout_id);

create table if not exists ebay_payouts (
  payout_id text primary key,
  payout_date timestamptz,
  amount numeric not null,
  status text,
  raw jsonb not null
);

create table if not exists ebay_returns (
  return_id text primary key,
  order_id text, state text, reason text,
  respond_by timestamptz,
  raw jsonb not null
);

create table if not exists ebay_messages (
  message_id text primary key,
  received_at timestamptz,
  sender text, subject text, item_id text,
  responded boolean,
  raw jsonb not null
);

create table if not exists sync_runs (
  id bigserial primary key,
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  rows_upserted int,
  error text
);

-- ── Action-list views ─────────────────────────────────────────────────────
create or replace view v_quotes_waiting as
select l.id, l.name, l.event_date, l.event_type, l.source, l.created_at,
       round(extract(epoch from now() - l.created_at) / 3600.0, 1) as hours_waiting
from leads l where l.stage = 'new'
order by l.created_at;

create or replace view v_upcoming_events as
select e.*,
  coalesce((select sum(p.amount) from payments p where p.event_id = e.id and p.status = 'COMPLETED'), 0) as paid,
  e.contract_total - coalesce((select sum(p.amount) from payments p where p.event_id = e.id and p.status = 'COMPLETED'), 0) as balance_due,
  (select count(*) from event_staff s where s.event_id = e.id and s.confirmed) as staff_confirmed
from events e where e.event_date >= current_date
order by e.event_date, e.start_time;

-- One van, one crew: same-day events, or staff double-booked on a date.
create or replace view v_date_conflicts as
select a.event_date, a.id as event_a, b.id as event_b, 'van' as resource
from events a join events b on a.event_date = b.event_date and a.id < b.id
where a.event_date >= current_date
union all
select a.event_date, a.id, b.id, 'staff:' || sa.staff_name
from events a
join event_staff sa on sa.event_id = a.id
join event_staff sb on sb.staff_name = sa.staff_name
join events b on b.id = sb.event_id and b.event_date = a.event_date and a.id < b.id
where a.event_date >= current_date;

create or replace view v_ebay_to_ship as
select o.order_id, o.created_at, o.ship_by, o.buyer_username, o.total,
       (o.ship_by at time zone 'America/Los_Angeles')::date <= (now() at time zone 'America/Los_Angeles')::date as due_today_or_late
from ebay_orders o
where o.fulfillment_status in ('NOT_STARTED','IN_PROGRESS')
order by o.ship_by;

create or replace view v_stale_listings as
select item_id, title, price, start_time, watch_count,
       (current_date - start_time::date) as days_listed
from ebay_listings
where quantity_available > 0 and start_time < now() - interval '60 days'
order by start_time;

-- ── Row-level security: team members only; server functions use service role ─
do $$ declare t text; begin
  foreach t in array array['team_members','quote_submissions','leads','lead_stage_events','events','event_staff',
    'payments','ebay_orders','ebay_line_items','ebay_listings','ebay_finance_txns','ebay_payouts',
    'ebay_returns','ebay_messages','sync_runs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists team_all on %I', t);
    execute format('create policy team_all on %I for all to authenticated using (is_team_member()) with check (is_team_member())', t);
  end loop;
end $$;

alter view v_quotes_waiting set (security_invoker = on);
alter view v_upcoming_events set (security_invoker = on);
alter view v_date_conflicts set (security_invoker = on);
alter view v_ebay_to_ship set (security_invoker = on);
alter view v_stale_listings set (security_invoker = on);
