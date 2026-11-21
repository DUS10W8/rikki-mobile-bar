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

// ── Don Julio (owner, Nov 20 evening): no upgrades; the Don Julio Margarita is its own drink ──
import { expandMenu } from "../src/order/drinkBuilder.js";
assert.ok(!menu.some((item) => item.upgrade), "no Don Julio upgrade rows on any drink");
const full = expandMenu(config, menu);
assert.equal(full.length, menu.length, "no Don Julio variants added");
assert.equal(menu.find((item) => item.id === "salsa-don-julio-margarita").priceCents, 1799);
ticket = priceTicket(config, full, [{ kind: "item", id: "salsa-don-julio-margarita", quantity: 1, mods: { pour: "double" } }]);
assert.equal(ticket.amountCents, 1799 + 700, "a double Don Julio Margarita is a top-shelf double");
assert.throws(() => priceTicket(config, full, [{ kind: "item", id: "salsa-lunazul-margarita", quantity: 1, mods: { upgrade: "dj-blanco" } }]), /upgraded/);

// The upgrade mechanism still works if an item is marked again (kept for future events).
const marked = menu.map((item) => item.id === "salsa-batanga" ? { ...item, upgrade: "tequila" } : item);
const markedFull = expandMenu(config, marked);
assert.equal(markedFull.find((item) => item.id === "salsa-batanga--dj-reposado").priceCents, 1199 + 500);
ticket = priceTicket(config, markedFull, [{ kind: "item", id: "salsa-batanga", quantity: 1, mods: { upgrade: "dj-reposado", pour: "double" } }]);
assert.equal(ticket.amountCents, 1199 + 500 + 700);

// Food changes
assert.equal(menu.find((item) => item.id === "salsa-pulled-pork-sandwich").priceCents, 1499);
assert.equal(menu.find((item) => item.id === "salsa-mini-helado").priceCents, 150);

// Shots on the guest QR menu cost the same as a shot rung on the register's builder.
const shots = menu.filter((item) => item.category === "Shots");
assert.ok(shots.length >= 5);
for (const shot of shots) {
  const rung = priceTicket(config, full, [{ kind: "build", liquor: shot.shot, style: "shot", quantity: 1, mods: {} }]);
  assert.equal(shot.priceCents, rung.amountCents, shot.name);
}

// Shot prices (owner, Nov 20): Don Julio $15.99, everything else $8.99, on both screens.
const shotPrice = (liquor) => priceTicket(config, full, [{ kind: "build", liquor, style: "shot", quantity: 1, mods: {} }]).amountCents;
assert.equal(shotPrice("don-julio-blanco"), 1599);
assert.equal(shotPrice("don-julio-reposado"), 1599);
for (const liquor of ["lunazul-blanco", "vodka-house", "whiskey-makers", "whiskey-weller-107", "rum-diplomatico", "kahlua"]) assert.equal(shotPrice(liquor), 899, liquor);
