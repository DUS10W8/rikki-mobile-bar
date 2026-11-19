-- Inventory catalog, Salsa Night recipes, and opening stock from the
-- November 18, 2026 bar count (BAR-INVENTORY-2026-11-18.md).
-- Run once in the Supabase SQL editor AFTER migration 20261118000000_inventory_deduction.sql.
-- Safe to re-run: items and opening entries are skipped if already present; recipes are updated.
--
-- Recipes come from POS-INVENTORY-DESIGN.md ("Drink buttons and deductions").
-- Cups, wedges, ice and rim seasoning are NOT deducted yet: the design doc says
-- verify those standards before activating them.
--
-- Confirmed by the owner Nov 18: house whiskey = Maker's Mark, house rum = Captain white,
-- house gin = The Botanist, house vodka = the 1.75 L vodka, triple sec = DeKuyper.
-- No more Patrón (removed from the menu). Hamilton drinks are intentionally not mapped.
-- Cups, limes, ice and rim salt start at ZERO and go negative as drinks sell, until a
-- delivery is logged. Costs: cups $0.13 each, limes $0.50 each, ice $3.00 per 10 lb.
--
-- STILL ASSUMED (change with one UPDATE on recipe_lines):
--   * 8 wedges per lime, so one wedge = 0.125 lime ($0.0625).
--   * Ice: 5 oz by weight per iced drink (about 0.3 lb). Weigh a cup of ice to confirm.
--   * Rim salt: 0.1 oz by weight per Margarita, no cost entered yet.
--   * Every mixed drink, cocktail and Modelo draft uses one cup; cans and bottles don't.
--   * Mule ginger beer is tracked by volume (Cock 'n Bull 7.5 fl oz on hand).
--   * Fever-Tree small bottles sold on their own are counted per bottle.

-- 1 mL = 0.033814 US fl oz
insert into public.inventory_items (sku, name, unit, package_size, package_label, low_stock_at) values
  -- Spirits and liqueurs (fl oz)
  ('lunazul-blanco',          'Lunazul tequila',               'fl_oz', 25.361, '750 mL bottle', 25.361),
  ('don-julio-blanco',        'Don Julio Blanco',              'fl_oz', 25.361, '750 mL bottle', null),
  ('don-julio-reposado',      'Don Julio Reposado',            'fl_oz', 25.361, '750 mL bottle', null),
  ('vodka-house',             'Vodka (house)',                 'fl_oz', 59.175, '1.75 L bottle', 15),
  ('rum-captain-white',       'Captain white rum',             'fl_oz', 25.361, '750 mL bottle', 6),
  ('whiskey-makers',          'Maker''s Mark',                 'fl_oz', 25.361, '750 mL bottle', 6),
  ('whiskey-weller-107',      'Weller 107',                    'fl_oz', 25.361, '750 mL bottle', null),
  ('rum-diplomatico',         'Diplomático dark rum',          'fl_oz', 25.361, '750 mL bottle', null),
  ('gin-botanist',            'The Botanist gin',              'fl_oz', 25.361, '750 mL bottle', 6),
  ('triple-sec-dekuyper',     'DeKuyper triple sec',           'fl_oz', 33.814, '1 L bottle', 6),
  ('grand-marnier',           'Grand Marnier',                 'fl_oz', 25.361, '750 mL bottle', null),
  ('aperol',                  'Aperol',                        'fl_oz', 25.361, '750 mL bottle', null),
  ('st-germain',              'St-Germain',                    'fl_oz', 25.361, '750 mL bottle', null),
  ('vermouth-dry-martini',    'Martini Extra Dry vermouth',    'fl_oz', 25.361, '750 mL bottle', null),
  ('kahlua',                  'Kahlúa',                        'fl_oz', 33.814, '1 L bottle', null),
  ('baileys',                 'Baileys',                       'fl_oz', 14.202, '420 mL bottle', null),
  -- Wine (size unreported: tracked by bottle)
  ('champagne-kirkland',      'Kirkland Champagne',            'each', null, 'bottle', null),
  ('wine-upchurch-red',       'Counter Post Upchurch Red Blend','each', null, 'bottle', null),
  -- Mixers (fl oz)
  ('lime-juice',              'Lime juice',                    'fl_oz', null, null, 16),
  ('agave',                   'Agave syrup',                   'fl_oz', null, null, 4),
  ('grapefruit-soda',         'Grapefruit soda',               'fl_oz', null, null, 40),
  ('club-soda',               'Club soda (mixing)',            'fl_oz', null, null, 24),
  ('cranberry-juice',         'Cranberry juice',               'fl_oz', 96, '96 fl oz jug', 24),
  ('pineapple-juice',         'Pineapple juice',               'fl_oz', null, null, 24),
  ('sprite',                  'Sprite',                        'fl_oz', null, null, 24),
  ('coke',                    'Coca-Cola',                     'fl_oz', null, null, 24),
  ('ginger-beer',             'Ginger beer (mules)',           'fl_oz', 7.5, '7.5 fl oz bottle', 24),
  ('strawberry-lemonade',     'Strawberry lemonade',           'fl_oz', 96, '96 fl oz jug', null),
  ('zing-zang',               'Zing Zang Bloody Mary mix',     'fl_oz', 59.2, '59.2 fl oz bottle', null),
  -- Draft
  ('modelo-keg',              'Modelo draft (keg)',            'fl_oz', 1984, '15.5 gal half-barrel', 120),
  -- Packaged, sold or served whole (each)
  ('coors-light',             'Coors Light can',               'each', null, null, 6),
  ('corona',                  'Corona bottle',                 'each', null, null, 6),
  ('white-claw',              'White Claw',                    'each', null, null, 6),
  ('spikedade',               'SpikedAde',                     'each', null, null, 6),
  ('red-bull',                'Red Bull can',                  'each', null, null, 6),
  ('fever-tree-club-soda',    'Fever-Tree club soda (small)',  'each', null, null, 4),
  ('fever-tree-ginger-beer',  'Fever-Tree ginger beer (small)','each', null, null, 4),
  ('modelo-can',              'Modelo 12 fl oz',               'each', null, null, null),
  ('big-wave',                'Big Wave 12 fl oz',             'each', null, null, null),
  ('stella-artois',           'Stella Artois 11.2 fl oz',      'each', null, null, null),
  ('la-croix',                'La Croix 12 fl oz',             'each', null, null, null),
  ('icelandic-tahitian-lime', 'Icelandic Tahitian Lime 12 fl oz','each', null, null, null),
  ('cold-brew',               'Cold brew 11 fl oz',            'each', null, null, null),
  ('chamoy-straw',            'Chamoy straw',                  'each', null, null, null),
  -- Pantry (label sizes unverified: tracked by package)
  ('cocoa',                   'Cocoa (27 oz)',                 'each', null, 'container', null),
  ('maple-syrup',             'Maple syrup (33.8 oz)',         'each', null, 'bottle', null),
  ('cherries',                'Cherries (26 oz)',              'each', null, 'jar', null),
  -- Service supplies: start at zero, go negative until receiving is logged
  ('cup',                     'Drink cup',                     'each', null, null, null),
  ('lime',                    'Lime (whole; wedge = 0.125)',   'each', null, null, null),
  ('ice',                     'Ice',                           'oz_wt', 160, '10 lb bag', null),
  ('rim-salt',                'Rim salt',                      'oz_wt', null, null, null),
  -- Salsa Night food: finished portions. Enter prepared yield at opening.
  ('food-pulled-pork-sandwich','Pulled pork sandwich',         'each', null, null, 5),
  ('food-rice-bean-bowl',     'Rice-and-bean bowl',            'each', null, null, 2),
  ('food-esquites',           'Esquites cup',                  'each', null, null, 5),
  ('food-paleta',             'Paleta',                        'each', null, null, 5),
  ('food-chips-salsa',        'Chips and salsa',               'each', null, null, 5)
on conflict (sku) do nothing;

update public.inventory_items set unit_cost_cents = c.cents
from (values ('cup', 13), ('lime', 50), ('ice', 1.875)) as c(sku, cents)  -- ice: 300¢ / 160 oz
where inventory_items.sku = c.sku;

insert into public.recipe_lines (menu_item_id, sku, quantity) values
  ('salsa-lunazul-paloma',    'lunazul-blanco', 1.5), ('salsa-lunazul-paloma', 'lime-juice', 0.5), ('salsa-lunazul-paloma', 'grapefruit-soda', 5),
  ('salsa-lunazul-margarita', 'lunazul-blanco', 1.5), ('salsa-lunazul-margarita', 'triple-sec-dekuyper', 0.5),
  ('salsa-lunazul-margarita', 'lime-juice', 0.75),    ('salsa-lunazul-margarita', 'agave', 0.25),
  ('salsa-vodka-soda',        'vodka-house', 1.5), ('salsa-vodka-soda', 'club-soda', 4),
  ('salsa-vodka-cranberry',   'vodka-house', 1.5), ('salsa-vodka-cranberry', 'cranberry-juice', 4),
  ('salsa-vodka-pineapple',   'vodka-house', 1.5), ('salsa-vodka-pineapple', 'pineapple-juice', 4),
  ('salsa-vodka-sprite',      'vodka-house', 1.5), ('salsa-vodka-sprite', 'sprite', 4),
  ('salsa-rum-coke',          'rum-captain-white', 1.5), ('salsa-rum-coke', 'coke', 4),
  ('salsa-rum-pineapple',     'rum-captain-white', 1.5), ('salsa-rum-pineapple', 'pineapple-juice', 4),
  ('salsa-whiskey-coke',      'whiskey-makers', 1.5), ('salsa-whiskey-coke', 'coke', 4),
  ('salsa-gin-soda',          'gin-botanist', 1.5), ('salsa-gin-soda', 'club-soda', 4),
  ('salsa-moscow-mule',       'vodka-house', 1.5),    ('salsa-moscow-mule', 'lime-juice', 0.5),   ('salsa-moscow-mule', 'ginger-beer', 4),
  ('salsa-lunazul-mule',      'lunazul-blanco', 1.5), ('salsa-lunazul-mule', 'lime-juice', 0.5),  ('salsa-lunazul-mule', 'ginger-beer', 4),
  ('salsa-whiskey-mule',      'whiskey-makers', 1.5), ('salsa-whiskey-mule', 'lime-juice', 0.5),  ('salsa-whiskey-mule', 'ginger-beer', 4),
  ('salsa-vodka-red-bull',    'vodka-house', 1.5), ('salsa-vodka-red-bull', 'red-bull', 1),
  ('salsa-modelo-draft',      'modelo-keg', 12),
  ('salsa-coors-light',       'coors-light', 1),
  ('salsa-corona',            'corona', 1),
  ('salsa-white-claw',        'white-claw', 1),
  ('salsa-spikedade',         'spikedade', 1),
  ('salsa-red-bull',          'red-bull', 1),
  ('salsa-fever-tree-club-soda',   'fever-tree-club-soda', 1),
  ('salsa-fever-tree-ginger-beer', 'fever-tree-ginger-beer', 1),
  ('salsa-pulled-pork-sandwich', 'food-pulled-pork-sandwich', 1),
  ('salsa-rice-and-bean-bowl',   'food-rice-bean-bowl', 1),
  ('salsa-esquites',             'food-esquites', 1),
  ('salsa-paleta',               'food-paleta', 1),
  ('salsa-chips-and-salsa',      'food-chips-salsa', 1)
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- Supplies per serving: one cup + ice for every poured drink, a wedge for
-- Palomas, Margaritas and mules, a salt rim for Margaritas. Draft gets a cup, no ice.
insert into public.recipe_lines (menu_item_id, sku, quantity)
select m.id, s.sku, s.qty
from (values
  ('salsa-lunazul-paloma', true, true, false), ('salsa-lunazul-margarita', true, true, true),
  ('salsa-moscow-mule', true, true, false), ('salsa-lunazul-mule', true, true, false),
  ('salsa-whiskey-mule', true, true, false),
  ('salsa-vodka-soda', true, false, false), ('salsa-vodka-cranberry', true, false, false),
  ('salsa-vodka-pineapple', true, false, false), ('salsa-vodka-sprite', true, false, false),
  ('salsa-rum-coke', true, false, false), ('salsa-rum-pineapple', true, false, false),
  ('salsa-whiskey-coke', true, false, false), ('salsa-gin-soda', true, false, false),
  ('salsa-vodka-red-bull', true, false, false),
  ('salsa-modelo-draft', false, false, false)
) as m(id, iced, wedge, rim)
cross join lateral (values ('cup', 1::numeric, true), ('ice', 5, m.iced),
                           ('lime', 0.125, m.wedge), ('rim-salt', 0.1, m.rim)) as s(sku, qty, applies)
where s.applies
on conflict (menu_item_id, sku) do update set quantity = excluded.quantity;

-- Opening stock from the Nov 18 count (packages × package size; partials as counted).
insert into public.inventory_ledger (sku, delta, reason, idempotency_key, note, actor)
select c.sku, round(c.packages * coalesce(i.package_size, 1), 3), 'opening',
       'opening:2026-11-18:' || c.sku, c.packages || ' package(s) counted Nov 18', 'count 2026-11-18'
from (values
  ('modelo-can', 13), ('big-wave', 8), ('stella-artois', 17),
  ('aperol', 1.25), ('st-germain', 1), ('triple-sec-dekuyper', 1), ('grand-marnier', 1),
  ('vermouth-dry-martini', 1), ('kahlua', 0.5), ('baileys', 1.25), ('whiskey-weller-107', 0.75),
  ('whiskey-makers', 1), ('rum-diplomatico', 2), ('gin-botanist', 0.5), ('vodka-house', 0.2),
  ('rum-captain-white', 1), ('champagne-kirkland', 2), ('wine-upchurch-red', 1),
  ('don-julio-reposado', 1), ('don-julio-blanco', 1), ('lunazul-blanco', 12),
  ('la-croix', 8), ('icelandic-tahitian-lime', 20), ('strawberry-lemonade', 4),
  ('cranberry-juice', 1), ('zing-zang', 1), ('ginger-beer', 20), ('cold-brew', 9),
  ('chamoy-straw', 50), ('cocoa', 0.5), ('maple-syrup', 1), ('cherries', 1)
) as c(sku, packages)
join public.inventory_items i on i.sku = c.sku
on conflict (idempotency_key) do nothing;
