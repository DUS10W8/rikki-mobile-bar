import assert from "node:assert/strict";
import handler from "../api/walkup-checkout.js";

// The register sends built drinks as lines; the server prices them itself and stores
// display lines for the guest screen plus inventory components for stock.
Object.assign(process.env, {
  WALKUP_STAFF_CODE: "a-test-staff-code-only", SQUARE_POS_APPLICATION_ID: "example",
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://www.example.test",
  SALES_TAX_BASIS_POINTS: "870",
});
let stored = null;
globalThis.fetch = async (url, options = {}) => {
  const { pathname } = new URL(url);
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "POST") { stored = JSON.parse(options.body); return Response.json([]); }
  if (pathname === "/rest/v1/walkup_checkouts") return Response.json(stored ? [{ ...stored, status: "waiting" }] : []);
  throw Error("unexpected " + pathname);
};
async function create(lines, extra = {}) {
  stored = null;
  const res = { setHeader() {}, status(value) { this.code = value; return this; }, json(data) { this.data = data; } };
  await handler({ method: "POST", headers: { "x-walkup-code": "a-test-staff-code-only", "x-walkup-request": "1" },
    body: { action: "create", id: "1370583e-d739-4684-82bb-004122a628ec", eventMenu: "salsa", name: "Maria", lines, ...extra } }, res);
  return res;
}

let res = await create([
  { kind: "build", liquor: "lunazul-blanco", style: "coke", quantity: 1, mods: { mixer: "light", lime: ["wedge"] } },
  { kind: "item", id: "salsa-lunazul-margarita", quantity: 1, mods: { rim: "none" } },
  { kind: "item", id: "salsa-modelo-draft", quantity: 2 },
]);
assert.equal(res.code, 201);
assert.equal(stored.amount_cents, 1199 + 1299 + 2 * 699);
assert.equal(stored.tax_cents, Math.floor((stored.amount_cents * 870 + 5000) / 10000));
assert.equal(stored.drink, "1 × Lunazul & Coke — Light mixer · Lime wedge, 1 × Lunazul Margarita — No rim, 2 × Modelo draft");
assert.deepEqual(stored.display_lines.map((line) => line.name), ["Lunazul & Coke", "Lunazul Margarita", "Modelo draft"]);
assert.deepEqual(stored.items.map((item) => item.id).sort(),
  ["b-mod-lime-wedge", "b-pour-lunazul-blanco", "b-style-coke", "salsa-lunazul-margarita", "salsa-modelo-draft"]);

// A client can't set its own price; bad options are refused with a message for staff.
res = await create([{ kind: "build", liquor: "lunazul-blanco", style: "coke", quantity: 1, mods: {}, unitCents: 1 }]);
assert.equal(stored.amount_cents, 1199);
res = await create([{ kind: "build", liquor: "lunazul-blanco", style: "neat", quantity: 1, mods: { ice: "light" } }]);
assert.equal(res.code, 400);
assert.match(res.data.error, /doesn't apply/);
assert.equal(stored, null);

// The old item-only request still works (QR-era clients, practice page).
res = await create(undefined, { items: [{ id: "salsa-corona", quantity: 1 }] });
assert.equal(res.code, 201);
assert.equal(stored.amount_cents, 699);
