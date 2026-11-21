-- Nov 20, 2026 (owner): Mini helado $1.50 and shots on the guest QR menu.
-- Safe to re-run.

-- Owner, later on Nov 20: no Don Julio upgrades. The Don Julio Margarita ($17.99) is its own drink
-- again; its recipe is already in 20261120000001_salsa_curated_recipes.sql.

-- Mini helado: finished portions, counted like the other food (enter the count at opening).
insert into public.inventory_items (sku, name, unit, package_size, package_label, low_stock_at)
values ('food-mini-helado', 'Mini helado', 'each', null, null, 5)
on conflict (sku) do nothing;
insert into public.recipe_lines (menu_item_id, sku, quantity)
values ('salsa-mini-helado', 'food-mini-helado', 1)
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- Shots: a 1.5 fl oz pour; tequila shots come with a lime wedge and a little salt.
insert into public.recipe_lines (menu_item_id, sku, quantity) values
  ('salsa-shot-lunazul-blanco', 'lunazul-blanco', 1.5), ('salsa-shot-lunazul-blanco', 'lime', 0.125), ('salsa-shot-lunazul-blanco', 'rim-salt', 0.05),
  ('salsa-shot-don-julio-blanco', 'don-julio-blanco', 1.5), ('salsa-shot-don-julio-blanco', 'lime', 0.125), ('salsa-shot-don-julio-blanco', 'rim-salt', 0.05),
  ('salsa-shot-don-julio-reposado', 'don-julio-reposado', 1.5), ('salsa-shot-don-julio-reposado', 'lime', 0.125), ('salsa-shot-don-julio-reposado', 'rim-salt', 0.05),
  ('salsa-shot-vodka-house', 'vodka-house', 1.5),
  ('salsa-shot-whiskey-makers', 'whiskey-makers', 1.5),
  ('salsa-shot-whiskey-weller-107', 'whiskey-weller-107', 1.5),
  ('salsa-shot-rum-diplomatico', 'rum-diplomatico', 1.5)
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;
