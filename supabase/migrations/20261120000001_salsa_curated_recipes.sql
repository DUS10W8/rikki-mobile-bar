-- Curated Salsa Night QR menu (Nov 20, 2026): recipes for the new drinks, from the Nov 18 count,
-- plus the owner's Nov 20 update: 4 gallons of Clamato received, house vodka counted at 2.75 L.
-- Pours are 1.5 fl oz. Cups 1 each, ice 5 oz by weight, a wedge = 0.125 lime, salt rim 0.1 oz.
-- Safe to re-run.

-- Clamato (4 x 1 gal) for micheladas and the register's Clamato mixer.
insert into public.inventory_items (sku, name, unit, package_size, package_label, low_stock_at)
values ('clamato', 'Clamato', 'fl_oz', 128, '1 gal jug', 32)
on conflict (sku) do nothing;
select public.record_stock_movement('clamato', 512, 'receive', 'receive:2026-11-20:clamato',
  '4 gallons on hand (owner, Nov 20)', 'owner via Claude');
-- House vodka: 2.75 L on hand (owner, Nov 20) = 92.989 fl oz. Recorded as a count, so it sets the balance.
select public.record_stock_count('vodka-house', 92.989, 'count:2026-11-20:vodka-house',
  '2.75 L total on hand (owner, Nov 20)', 'owner via Claude');

insert into public.recipe_lines (menu_item_id, sku, quantity) values
  ('salsa-batanga',             'lunazul-blanco', 1.5), ('salsa-batanga', 'coke', 4),
  ('salsa-batanga',             'lime', 0.125), ('salsa-batanga', 'rim-salt', 0.1),
  ('salsa-ranch-water',         'lunazul-blanco', 1.5), ('salsa-ranch-water', 'icelandic-tahitian-lime', 1),
  ('salsa-ranch-water',         'lime-juice', 0.5), ('salsa-ranch-water', 'lime', 0.125),
  ('salsa-tequila-fresa',       'lunazul-blanco', 1.5), ('salsa-tequila-fresa', 'strawberry-lemonade', 4),
  ('salsa-tequila-fresa',       'lime', 0.125), ('salsa-tequila-fresa', 'chamoy-straw', 1),
  ('salsa-don-julio-margarita', 'don-julio-blanco', 1.5), ('salsa-don-julio-margarita', 'triple-sec-dekuyper', 0.5),
  ('salsa-don-julio-margarita', 'lime-juice', 0.75), ('salsa-don-julio-margarita', 'agave', 0.25),
  ('salsa-don-julio-margarita', 'lime', 0.125), ('salsa-don-julio-margarita', 'rim-salt', 0.1),
  ('salsa-don-julio-reposado',  'don-julio-reposado', 1.5), ('salsa-don-julio-reposado', 'lime', 0.125),
  ('salsa-michelada',           'modelo-keg', 12), ('salsa-michelada', 'clamato', 4),
  ('salsa-michelada',           'lime-juice', 0.5), ('salsa-michelada', 'lime', 0.125),
  ('salsa-michelada',           'rim-salt', 0.1), ('salsa-michelada', 'chamoy-straw', 1),
  ('salsa-cuba-libre',          'rum-captain-white', 1.5), ('salsa-cuba-libre', 'coke', 4), ('salsa-cuba-libre', 'lime', 0.125),
  ('salsa-diplomatico-rocks',   'rum-diplomatico', 1.5),
  ('salsa-vodka-fresa',         'vodka-house', 1.5), ('salsa-vodka-fresa', 'strawberry-lemonade', 4),
  ('salsa-vodka-fresa',         'lime', 0.125),
  ('salsa-fresa-lemonade',      'strawberry-lemonade', 8),
  ('salsa-sparkling-lime',      'icelandic-tahitian-lime', 1),
  ('salsa-cold-brew',           'cold-brew', 1)
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- A cup for every poured drink; ice for everything served over ice.
insert into public.recipe_lines (menu_item_id, sku, quantity)
select m.id, s.sku, s.qty
from (values ('salsa-batanga', true), ('salsa-ranch-water', true), ('salsa-tequila-fresa', true),
             ('salsa-don-julio-margarita', true), ('salsa-don-julio-reposado', true), ('salsa-michelada', true),
             ('salsa-cuba-libre', true), ('salsa-diplomatico-rocks', true), ('salsa-vodka-fresa', true),
             ('salsa-fresa-lemonade', true), ('salsa-cold-brew', true)) as m(id, iced)
cross join lateral (values ('cup', 1::numeric, true), ('ice', 5, m.iced)) as s(sku, qty, applies)
where s.applies
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- The Michelada was first drafted with Zing Zang; it uses Clamato.
delete from public.recipe_lines where menu_item_id = 'salsa-michelada' and sku = 'zing-zang';
