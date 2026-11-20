-- Curated Salsa Night QR menu (Nov 20, 2026): recipes for the new drinks, from the Nov 18 count.
-- Pours are 1.5 fl oz. Cups 1 each, ice 5 oz by weight, a wedge = 0.125 lime, salt rim 0.1 oz.
-- Safe to re-run.
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
  ('salsa-michelada',           'modelo-keg', 12), ('salsa-michelada', 'zing-zang', 3),
  ('salsa-michelada',           'lime-juice', 0.5), ('salsa-michelada', 'lime', 0.125),
  ('salsa-michelada',           'rim-salt', 0.1), ('salsa-michelada', 'chamoy-straw', 1),
  ('salsa-cuba-libre',          'rum-captain-white', 1.5), ('salsa-cuba-libre', 'coke', 4), ('salsa-cuba-libre', 'lime', 0.125),
  ('salsa-diplomatico-rocks',   'rum-diplomatico', 1.5),
  ('salsa-carajillo',           'kahlua', 1.5), ('salsa-carajillo', 'cold-brew', 0.25),
  ('salsa-fresa-lemonade',      'strawberry-lemonade', 8),
  ('salsa-sparkling-lime',      'icelandic-tahitian-lime', 1),
  ('salsa-cold-brew',           'cold-brew', 1)
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- A cup for every poured drink; ice for everything served over ice.
insert into public.recipe_lines (menu_item_id, sku, quantity)
select m.id, s.sku, s.qty
from (values ('salsa-batanga', true), ('salsa-ranch-water', true), ('salsa-tequila-fresa', true),
             ('salsa-don-julio-margarita', true), ('salsa-don-julio-reposado', true), ('salsa-michelada', true),
             ('salsa-cuba-libre', true), ('salsa-diplomatico-rocks', true), ('salsa-carajillo', true),
             ('salsa-fresa-lemonade', true), ('salsa-cold-brew', true)) as m(id, iced)
cross join lateral (values ('cup', 1::numeric, true), ('ice', 5, m.iced)) as s(sku, qty, applies)
where s.applies
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;
