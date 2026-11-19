# Inventory deduction: how it works and how to run it

## What happens on every order
1. Both checkouts (QR `/order` and walk-up) now save the cart as structured `items` (menu id, name, quantity, price), not just the "2 × Margarita" text.
2. When Square payment is verified, `release_paid_drink` / `release_paid_walkup` put the ticket in the bartender queue **and in the same transaction** write `order_lines` and deduct each line's recipe from stock.
3. Stock lives in `inventory_ledger` (append-only). On hand = sum of entries per SKU. Duplicate Square notifications and retries never deduct twice.
4. An item with no recipe is **not guessed**. It lands in `inventory_exceptions`. Hamilton drinks are intentionally unmapped, so ignore those rows.
5. Cups, limes, ice and rim salt started at **zero** and go negative as drinks sell. Log deliveries to bring them back up. Costs: cup 13¢, lime 50¢ (8 wedges per lime), ice $3.00 per 10 lb bag.

## Go-live order (important)
1. In Supabase SQL editor, run `supabase/migrations/20261118000000_inventory_deduction.sql`.
2. Then run `supabase/seed/inventory_2026-11-18.sql` (catalog, Salsa recipes, today's count as opening stock).
3. Only then deploy the site. The new checkout code writes an `items` column that exists only after step 1; deploying first would break checkout.

## Daily use (SQL editor)
```sql
-- What's left, and what's low
select * from inventory_on_hand order by low desc, sku;
select * from menu_servings_left order by servings_left;
select * from inventory_exceptions where resolved_at is null and menu_item_id not like 'hamilton-%';
-- What supplies cost: per SKU (used_cost_cents) and per order
select sku, on_hand, used_cost_cents, waste_cost_cents from inventory_on_hand where unit_cost_cents is not null;
select * from order_supply_cost order by cost_cents desc;

-- Log a supply delivery (ice in oz by weight: 10 lb = 160)
select record_stock_movement('ice', 8 * 160, 'receive', 'rx-2026-11-21-ice', '8 bags', 'rikki');
select record_stock_movement('cup', 500, 'receive', 'rx-2026-11-21-cups', null, 'rikki');
select record_stock_movement('lime', 60, 'receive', 'rx-2026-11-21-limes', null, 'rikki');

-- Receive stock (key makes a retry safe; use a new key per delivery)
select record_stock_movement('lunazul-blanco', 4 * 25.361, 'receive', 'rx-2026-11-20-lunazul', '4 bottles', 'rikki');
-- Prepared food yield at opening
select record_stock_movement('food-pulled-pork-sandwich', 50, 'receive', 'prep-salsa-pork', 'batch yield', 'rikki');
-- Spill or waste (negative)
select record_stock_movement('lunazul-blanco', -1.5, 'waste', 'spill-0412', 'dropped shaker', 'dani');
-- End-of-night count: returns variance (negative = shortage) and posts the adjustment
select record_stock_count('lunazul-blanco', 11.5 * 25.361, 'close-2026-11-21-lunazul', null, 'rikki');
-- Paid order cancelled before anyone started it: put the stock back
select void_order_inventory('<order uuid>', 'guest left', 'rikki');
```
Once a drink is started, voids are refused on purpose: record waste instead. Refunds are money-only and handled in Square.

## Settings in the seed file
House spirits confirmed: Maker's, Captain white, The Botanist, DeKuyper, 1.75 L vodka. Patrón is off the menu.
Still estimates, change with one `update recipe_lines ...`: 5 oz ice per iced drink, 8 wedges per lime, 0.1 oz rim salt per Margarita (no salt cost entered yet).

## Not built yet
- A stock panel in the bartender dashboard (read the views above for now).
- Sold-out toggle that hides items from the menu when stock runs out.
