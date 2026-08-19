-- Adds table_number support to the orders table so the bartender dashboard
-- can show which table placed each order (fed by per-table QR codes).
-- Run this once in the Supabase SQL editor for the production project.

alter table public.orders
  add column if not exists table_number smallint;

alter table public.orders
  add constraint orders_table_number_range
  check (table_number is null or (table_number >= 1 and table_number <= 12));

comment on column public.orders.table_number is
  'Table number (1-12) captured from the QR code the guest scanned at /order?table=N. Null if the guest did not scan a table QR code.';
