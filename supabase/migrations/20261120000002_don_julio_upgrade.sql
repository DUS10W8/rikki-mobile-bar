-- Nov 20, 2026 (owner): Don Julio upgrade on every Lunazul tequila drink (+$5), Mini helado $1.50,
-- and shots on the guest QR menu.
-- Safe to re-run.

-- Each upgradable drink's Don Julio version ("<id>--dj-blanco" / "--dj-reposado") uses the same
-- recipe as the drink, with the Lunazul pour swapped for the Don Julio bottle.
insert into public.recipe_lines (menu_item_id, sku, quantity)
select r.menu_item_id || '--' || u.option_id,
       case when r.sku = 'lunazul-blanco' then u.sku else r.sku end,
       r.quantity
from public.recipe_lines r
cross join (values ('dj-blanco', 'don-julio-blanco'), ('dj-reposado', 'don-julio-reposado')) as u(option_id, sku)
where r.menu_item_id in ('salsa-lunazul-margarita', 'salsa-lunazul-paloma', 'salsa-batanga',
                         'salsa-ranch-water', 'salsa-tequila-fresa', 'salsa-lunazul-mule')
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

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
