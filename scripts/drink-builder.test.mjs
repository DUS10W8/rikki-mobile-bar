import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { componentRecipes, defaultMods, groupsFor, priceTicket } from "../src/order/drinkBuilder.js";

const require = createRequire(import.meta.url);
const config = require("../src/order/drinkBuilder.json");
const menu = require("../src/order/salsaMenu.json");

// Lunazul margarita, double, Tajín instead of salt, light ice: call $11.99 + margarita $1 + double $5.
let ticket = priceTicket(config, menu, [{ kind: "build", liquor: "lunazul-blanco", style: "margarita", quantity: 1,
  mods: { pour: "double", rim: "tajin", ice: "light" } }]);
assert.equal(ticket.amountCents, 1799);
assert.equal(ticket.drink, "1 × Lunazul margarita — Double · Light ice · Tajín rim");
assert.deepEqual(ticket.items.map((item) => item.id).sort(),
  ["b-double-lunazul-blanco", "b-pour-lunazul-blanco", "b-style-margarita"]);

// Lunazul & Coke with light lime... (from the owner's example): coke, extra lime, no default garnish.
ticket = priceTicket(config, menu, [{ kind: "build", liquor: "lunazul-blanco", style: "coke", quantity: 2,
  mods: { lime: ["wedge", "extra-juice"], mixer: "light" } }]);
assert.equal(ticket.amountCents, 2 * 1199);
assert.equal(ticket.drink, "2 × Lunazul & Coke — Light mixer · Lime wedge · Extra lime juice");
assert.equal(ticket.items.find((item) => item.id === "b-pour-lunazul-blanco").quantity, 2);
assert.ok(ticket.items.some((item) => item.id === "b-mod-lime-wedge"));

// Margarita with the salt taken off reads "No rim"; the default wedge removed reads "No lime wedge".
ticket = priceTicket(config, menu, [{ kind: "build", liquor: "don-julio-blanco", style: "margarita", quantity: 1,
  mods: { rim: "none", lime: [] } }]);
assert.equal(ticket.amountCents, 1499 + 100);
assert.equal(ticket.drink, "1 × Don Julio Blanco margarita — No rim · No lime wedge");

// Signature button with options keeps its menu price and recipe id.
ticket = priceTicket(config, menu, [{ kind: "item", id: "salsa-lunazul-margarita", quantity: 1, mods: { rim: "half-salt" }, note: "spicy, please" }]);
assert.equal(ticket.amountCents, 1299);
assert.equal(ticket.drink, '1 × Margarita — Half salt rim · "spicy please"');
assert.ok(ticket.items.some((item) => item.id === "salsa-lunazul-margarita"));

// Plain menu items (beer, food) still work and keep their price on the inventory line.
ticket = priceTicket(config, menu, [{ kind: "item", id: "salsa-modelo-draft", quantity: 3 }]);
assert.equal(ticket.amountCents, 3 * 699);
assert.deepEqual(ticket.items, [{ id: "salsa-modelo-draft", name: "Modelo draft", quantity: 3, price_cents: 699 }]);
assert.deepEqual(ticket.displayLines, [{ name: "Modelo draft", mods: [], quantity: 3, unit_price_cents: 699 }]);

// Red Bull is a paid mixer; Maker's neat has no ice group.
ticket = priceTicket(config, menu, [{ kind: "build", liquor: "vodka-house", style: "red-bull", quantity: 1, mods: {} },
  { kind: "build", liquor: "whiskey-makers", style: "neat", quantity: 1, mods: {} }]);
assert.equal(ticket.amountCents, 999 + 300 + 1199);
assert.ok(!groupsFor(config, "neat").some((group) => group.id === "ice"));
assert.throws(() => priceTicket(config, menu, [{ kind: "build", liquor: "whiskey-makers", style: "neat", quantity: 1, mods: { ice: "light" } }]), /doesn't apply/);

// Refusals: unknown liquor, unknown option, a beer with options, too many of one pour, a comma-free ticket.
assert.throws(() => priceTicket(config, menu, [{ kind: "build", liquor: "patron", style: "soda", quantity: 1, mods: {} }]), /liquor/);
assert.throws(() => priceTicket(config, menu, [{ kind: "build", liquor: "vodka-house", style: "soda", quantity: 1, mods: { pour: "triple" } }]), /Pour/);
assert.throws(() => priceTicket(config, menu, [{ kind: "item", id: "salsa-corona", quantity: 1, mods: { rim: "salt" } }]), /no options/);
assert.throws(() => priceTicket(config, menu, [
  { kind: "build", liquor: "vodka-house", style: "soda", quantity: 6, mods: {} },
  { kind: "build", liquor: "vodka-house", style: "cranberry", quantity: 6, mods: {} }]), /Split it/);
assert.throws(() => priceTicket(config, menu, [{ kind: "build", liquor: "vodka-house", style: "soda", quantity: 11, mods: {} }]), /1 to 10/);
assert.ok(!priceTicket(config, menu, [{ kind: "build", liquor: "vodka-house", style: "soda", quantity: 1, mods: {}, note: "a, b" }]).drink.slice(2).includes(","));

// Defaults: a margarita starts with salt and a wedge.
assert.deepEqual(defaultMods(config, "margarita").rim, "salt");
assert.deepEqual(defaultMods(config, "margarita").lime, ["wedge"]);

// Every component a ticket can produce has a recipe; double pours deduct another 1.5 oz.
const recipes = componentRecipes(config);
assert.deepEqual(recipes.find(([id]) => id === "b-double-lunazul-blanco"), ["b-double-lunazul-blanco", "lunazul-blanco", 1.5]);
assert.ok(recipes.some(([id, sku]) => id === "b-style-neat" && sku === "cup"));
assert.ok(!recipes.some(([id, sku]) => id === "b-style-neat" && sku === "ice"));

// ── Don Julio upgrade (owner, Nov 20): every Lunazul tequila drink, +$3 ─────────
import { expandMenu } from "../src/order/drinkBuilder.js";
const full = expandMenu(config, menu);
const variant = full.find((item) => item.id === "salsa-lunazul-margarita--dj-blanco");
assert.equal(variant.name, "Margarita · Don Julio Blanco");
assert.equal(variant.priceCents, 1299 + 300);
assert.equal(variant.description, "Don Julio Blanco tequila, triple sec, fresh lime, agave, salt rim");
assert.equal(variant.description_es, "Tequila Don Julio Blanco, triple sec, limón fresco, agave, escarchado de sal");
const upgradable = menu.filter((item) => item.upgrade === "tequila").map((item) => item.id);
assert.deepEqual(upgradable.sort(), ["salsa-batanga", "salsa-lunazul-margarita", "salsa-lunazul-mule",
  "salsa-lunazul-paloma", "salsa-ranch-water", "salsa-tequila-fresa"]);
assert.equal(full.filter((item) => item.variantOf).length, upgradable.length * 2);
assert.ok(!menu.some((item) => item.id === "salsa-don-julio-margarita"), "folded into the Margarita upgrade");

// Register: upgrade a Batanga to Reposado, make it a double (top-shelf double +$7).
ticket = priceTicket(config, full, [{ kind: "item", id: "salsa-batanga", quantity: 1, mods: { upgrade: "dj-reposado", pour: "double" } }]);
assert.equal(ticket.amountCents, 1199 + 300 + 700);
assert.equal(ticket.drink, "1 × Batanga · Don Julio Reposado — Double");
assert.deepEqual(ticket.items.map((item) => item.id).sort(), ["b-double-don-julio-reposado", "salsa-batanga--dj-reposado"]);
// "house" keeps the Lunazul drink; an unknown upgrade or one on a beer is refused.
ticket = priceTicket(config, full, [{ kind: "item", id: "salsa-lunazul-paloma", quantity: 2, mods: { upgrade: "house" } }]);
assert.equal(ticket.amountCents, 2 * 1299);
assert.throws(() => priceTicket(config, full, [{ kind: "item", id: "salsa-lunazul-paloma", quantity: 1, mods: { upgrade: "patron" } }]), /upgraded/);
assert.throws(() => priceTicket(config, full, [{ kind: "item", id: "salsa-corona", quantity: 1, mods: { upgrade: "dj-blanco" } }]), /upgraded/);
// QR guests order the variant directly by id.
ticket = priceTicket(config, full, [{ kind: "item", id: "salsa-ranch-water--dj-blanco", quantity: 1 }]);
assert.equal(ticket.amountCents, 1199 + 300);

// Food changes
assert.equal(menu.find((item) => item.id === "salsa-pulled-pork-sandwich").priceCents, 1499);
assert.equal(menu.find((item) => item.id === "salsa-mini-helado").priceCents, 150);
