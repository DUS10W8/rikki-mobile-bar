-- Nov 20, 2026 (owner): Don Julio upgrade on every Lunazul tequila drink (+$3), Mini helado $1.50.
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
