-- Insert-only intake for the public site. Callable with the anon key; it can add
-- a quote (idempotently, keyed on the browser-generated submission_id) and link
-- it to a lead, but cannot read or change anything else.
create or replace function record_quote(p_row jsonb, p_source text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := (p_row ->> 'submission_id')::uuid;
  v_lead uuid;
  v_email text := lower(nullif(trim(p_row ->> 'email'), ''));
  v_date date := nullif(p_row ->> 'event_date', '')::date;
begin
  if v_id is null or coalesce(trim(p_row ->> 'name'), '') = '' then
    raise exception 'submission_id and name are required';
  end if;
  if octet_length(p_row::text) > 60000 then
    raise exception 'payload too large';
  end if;

  insert into quote_submissions (
    submission_id, origin, name, email, phone, event_date, event_type, service_type,
    guest_count, duration, bar_tier, bar_payment_model, estimate_min, estimate_max,
    promo_code, attribution, payload)
  values (
    v_id, 'site', left(p_row ->> 'name', 200), v_email, left(p_row ->> 'phone', 40), v_date,
    left(p_row ->> 'event_type', 40), left(p_row ->> 'service_type', 40),
    nullif(p_row ->> 'guest_count', '')::int, left(p_row ->> 'duration', 20),
    left(p_row ->> 'bar_tier', 80), left(p_row ->> 'bar_payment_model', 80),
    nullif(p_row ->> 'estimate_min', '')::numeric, nullif(p_row ->> 'estimate_max', '')::numeric,
    left(p_row ->> 'promo_code', 40), coalesce(p_row -> 'attribution', '{}'::jsonb),
    coalesce(p_row -> 'payload', '{}'::jsonb))
  on conflict (submission_id) do nothing;

  select lead_id into v_lead from quote_submissions where submission_id = v_id;
  if v_lead is not null then
    return v_lead;
  end if;

  if v_email is not null then
    select id into v_lead from leads
    where email = v_email and event_date is not distinct from v_date and stage not in ('done', 'lost')
    order by created_at desc limit 1;
  end if;

  if v_lead is null then
    insert into leads (name, email, phone, event_date, event_type, source, quoted_total)
    values (left(p_row ->> 'name', 200), v_email, left(p_row ->> 'phone', 40), v_date,
            left(p_row ->> 'event_type', 40), left(coalesce(p_source, 'direct'), 40),
            nullif(p_row ->> 'estimate_max', '')::numeric)
    returning id into v_lead;
  end if;

  update quote_submissions set lead_id = v_lead where submission_id = v_id;
  return v_lead;
end $$;

revoke all on function record_quote(jsonb, text) from public;
grant execute on function record_quote(jsonb, text) to anon, authenticated;
