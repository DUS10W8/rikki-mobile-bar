import assert from "node:assert/strict";
import handler from "../api/drink-checkout.js";

Object.assign(process.env, {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake",
  SQUARE_LOCATION_ID: "bar",
  ORDER_SITE_URL: "https://example.test",
  SQUARE_ENVIRONMENT: "sandbox",
});

const id = "1370583e-d739-4684-82bb-004122a628ec";
let checkout;
let order;
let squareOrder;
let releases = 0;
const payment = { order_id: "order-1", status: "APPROVED", location_id: "bar", amount_money: { amount: 1300, currency: "USD" } };
const json = (body) => Response.json(body);
globalThis.fetch = async (input, options) => {
  const { pathname } = new URL(input);
  switch (pathname) {
    case "/v2/online-checkout/payment-links":
      squareOrder = JSON.parse(options.body);
      return json({ payment_link: { url: "https://square.link/example", order_id: "order-1" } });
    case "/rest/v1/drink_checkouts":
      if (options.method === "POST") checkout = JSON.parse(options.body);
      return json(options.method === "POST" ? [] : [checkout]);
    case "/v2/payments/payment-1":
      return json({ payment });
    case "/v2/orders/order-1":
      return json({ order: { tenders: [{ payment_id: "payment-1" }] } });
    case "/rest/v1/rpc/release_paid_drink":
      releases += 1;
      order ??= { id: "ticket-1", table_number: checkout.table_number };
      return json(null);
    case "/rest/v1/orders":
      return json(order ? [order] : []);
    default:
      throw Error(pathname);
  }
};

async function call(method, body) {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; }, end() {} };
  await handler({ method, body, query: { checkout: id } }, res);
  return res;
}

const details = { id, drinkId: "atlas-espresso-martini", name: "Alex", phone: "", table: 7, amountCents: 1300 };
assert.equal((await call("POST", { ...details, amountCents: 1 })).code, 409);
assert.equal((await call("POST", { ...details, drinkId: "event-modelo" })).code, 409);
assert.equal((await call("POST", { ...details, drinkId: "atlas-na-cranberry-spritz" })).code, 409);
assert.equal((await call("POST", { ...details, drinkId: "atlas-cranberry-spritz", amountCents: 1200 })).code, 409);
for (const [drinkId, amountCents, name] of [
  ["atlas-espresso-martini", 1300, "Espresso Martini"],
  ["atlas-mint-to-be-beautiful", 1200, "Mint to Be Beautiful Mojito"],
  ["atlas-cranberry-spritz", 1100, "Cranberry Spritz"],
  ["atlas-aperol-spritz", 1200, "Aperol Spritz"],
  ["atlas-classic-martini", 1300, "Classic Martini"],
  ["atlas-vodka-soda", 900, "Vodka Soda"],
  ["atlas-vodka-cranberry", 900, "Vodka Cranberry"],
  ["atlas-rum-coke", 900, "Rum & Coke"],
  ["atlas-gin-tonic", 900, "Gin & Tonic"],
  ["atlas-whiskey-coke", 1000, "Whiskey & Coke"],
  ["atlas-basic-mixed-drink", 1000, "Basic Mixed Drink"],
  ["atlas-premium-mixed-drink", 1300, "Premium Mixed Drink"],
  ["atlas-sparkling-wine", 1000, "Champagne / Sparkling Wine"],
  ["atlas-premium-red-wine", 1200, "Premium Red Wine"],
  ["atlas-baileys", 900, "Baileys 2 oz"],
  ["atlas-social-tonic-energy", 1000, "Social Tonic Energy"],
  ["atlas-social-tonic-calm", 1000, "Social Tonic Calm"],
  ["atlas-social-tonic-hydrate", 1000, "Social Tonic Hydrate"],
  ["atlas-social-tonic-social", 1000, "Social Tonic Social"],
  ["atlas-mockjito", 800, "Mockjito"],
  ["atlas-classic-hot-cocoa", 500, "Classic Hot Cocoa"],
  ["atlas-loaded-cocoa", 800, "Loaded Cocoa"],
  ["atlas-baileys-hot-cocoa", 1200, "Baileys Hot Cocoa"],
]) {
  assert.equal((await call("POST", { ...details, drinkId, amountCents })).code, 200);
  assert.equal(squareOrder.quick_pay.price_money.amount, amountCents);
  assert.equal(squareOrder.quick_pay.name, name);
  assert.equal(checkout.drink, name);
}
assert.equal((await call("POST", details)).code, 200);
assert.equal(squareOrder.quick_pay.price_money.amount, 1300);
assert.equal(checkout.table_number, 7);
assert.equal((await call("GET")).code, 202);
const notification = { type: "payment.updated", data: { object: { payment: { id: "payment-1", order_id: "order-1", status: "COMPLETED" } } } };
assert.equal((await call("POST", notification)).code, 204);
assert.equal(releases, 0);
payment.status = "COMPLETED";
payment.amount_money.amount = 1299;
await call("POST", notification);
assert.equal(releases, 0);
payment.amount_money.amount = 1300;
assert.equal((await call("POST", notification)).code, 204);
assert.equal(releases, 1);
assert.deepEqual((await call("GET")).data.order, { id: "ticket-1", table_number: 7 });
await call("POST", notification);
assert.equal(releases, 2);
assert.match(await (await import("node:fs/promises")).readFile("supabase/migrations/20261107000000_paid_drink_orders.sql", "utf8"), /on conflict \(square_order_id\) do nothing/i);
order = undefined;
assert.equal((await call("GET")).code, 200);
console.log("Checkout payment-gate checks passed with mocked Square and Supabase.");
