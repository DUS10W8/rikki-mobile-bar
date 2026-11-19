import assert from "node:assert/strict";
import walkup from "../api/walkup-checkout.js";
import bartender from "../api/bartender-orders.js";
import drinkCheckout from "../api/drink-checkout.js";
import sms from "../api/send-ready-sms.js";
import { resetTaxCache, taxCents } from "../src/server/tax.js";

const code = "a-test-staff-code-only";
Object.assign(process.env, {
  WALKUP_STAFF_CODE: code, SQUARE_POS_APPLICATION_ID: "example", SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "fake", SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar",
  ORDER_SITE_URL: "https://www.example.test", SALES_TAX_BASIS_POINTS: "0",
  TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "t", TWILIO_FROM_NUMBER: "+15550000000",
});

// Tax math: whole subtotal, half-up to the cent
assert.equal(taxCents(2598, 0), 0);
assert.equal(taxCents(2598, 890), 231);      // 231.222
assert.equal(taxCents(50, 890), 4);          // 4.45 → 4
assert.equal(taxCents(1000, 865), 87);       // 86.5 → 87 (half up)

const rows = new Map();
const rpcCalls = [];
let rpcResult = null;
let rpcError = null;
let orders = [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "New", created_at: "2026-11-21T03:00:00Z", phone: "+15095550100" }];
let catalogTaxes = [];
let twilioCalls = 0;
globalThis.fetch = async (url, options = {}) => {
  const { pathname, searchParams } = new URL(url);
  const method = options.method ?? "GET";
  if (pathname === "/rest/v1/walkup_checkouts" && method === "POST") {
    const row = JSON.parse(options.body);
    if (!rows.has(row.id)) rows.set(row.id, { ...row, status: "waiting" });
    return Response.json([]);
  }
  if (pathname === "/rest/v1/walkup_checkouts" && method === "GET") {
    const id = searchParams.get("id")?.replace("eq.", "");
    return Response.json(id ? (rows.has(id) ? rows.get(id) : null) : [...rows.values()]);
  }
  if (pathname === "/rest/v1/cash_shift_summary") return Response.json(null);
  if (pathname.startsWith("/rest/v1/rpc/")) {
    rpcCalls.push({ name: pathname.slice(13), args: JSON.parse(options.body) });
    if (rpcError) return Response.json(rpcError, { status: 400 });
    return Response.json(rpcResult);
  }
  if (pathname === "/rest/v1/orders" && method === "GET") {
    const id = searchParams.get("id")?.replace("eq.", "");
    if (options.headers?.Prefer?.includes("count=exact") || searchParams.has("lte") || searchParams.get("created_at")) {
      return new Response(null, { status: 200, headers: { "Content-Range": "0-0/3" } });
    }
    const pick = (o) => Object.fromEntries((searchParams.get("select") ?? "*").split(",").filter((k) => k in o).map((k) => [k, o[k]]));
    const found = id ? orders.find((o) => o.id === id) : null;
    return Response.json(id ? (found ? pick(found) : null) : orders.map(pick));
  }
  if (pathname === "/rest/v1/orders" && method === "PATCH") {
    const id = searchParams.get("id")?.replace("eq.", "");
    const order = orders.find((o) => o.id === id);
    if (order) Object.assign(order, JSON.parse(options.body));
    return Response.json(order ?? null);
  }
  if (pathname === "/v2/catalog/list") return Response.json({ objects: catalogTaxes });
  if (pathname.includes("/Messages.json")) { twilioCalls += 1; return Response.json({ sid: "SM1" }); }
  if (pathname === "/rest/v1/orders" && method === "HEAD") return new Response(null, { headers: { "Content-Range": "0-0/3" } });
  throw Error(method + " " + pathname);
};

async function call(handler, { method = "POST", body, headers = {}, query = {} } = {}) {
  const res = { headers: {}, setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.code = value; return this; }, json(data) { this.data = data; }, end() {} };
  await handler({ method, body, query, headers: { "x-walkup-request": "1", ...headers } }, res);
  return res;
}
const staff = { "x-walkup-code": code };
const W = (body, headers = staff) => call(walkup, { body, headers });

// ── Ring the brief's order (Lunazul Paloma; Patrón no longer exists) ──────────
const id = "1370583e-d739-4684-82bb-004122a628ec";
const items = [{ id: "salsa-pulled-pork-sandwich", quantity: 1 }, { id: "salsa-lunazul-paloma", quantity: 1 }];
assert.equal((await W({ action: "create", id, eventMenu: "salsa", name: "", items: [{ id: "salsa-patron-paloma", quantity: 1 }] })).code, 400);
const created = await W({ action: "create", id, eventMenu: "salsa", name: "", items });
assert.equal(created.code, 201);
assert.equal(rows.get(id).amount_cents, 2598);
assert.equal(rows.get(id).tax_cents, 0);
assert.equal(created.data.order.amount_cents + created.data.order.tax_cents, 2598);

// Nonzero tax from Square's catalog when no override is set
delete process.env.SALES_TAX_BASIS_POINTS; resetTaxCache();
catalogTaxes = [
  { type: "TAX", present_at_all_locations: true, tax_data: { percentage: "8.9", inclusion_type: "ADDITIVE", enabled: true, applies_to_custom_amounts: true } },
  { type: "TAX", present_at_all_locations: true, tax_data: { percentage: "5", inclusion_type: "INCLUSIVE", enabled: true } },
  { type: "TAX", present_at_all_locations: false, present_at_location_ids: ["other"], tax_data: { percentage: "2", inclusion_type: "ADDITIVE", enabled: true } },
];
const taxedId = "2370583e-d739-4684-82bb-004122a628ec";
await W({ action: "create", id: taxedId, eventMenu: "salsa", name: "T", items });
assert.equal(rows.get(taxedId).tax_basis_points, 890);
assert.equal(rows.get(taxedId).tax_cents, 231);
// Square unreachable → tax unknown (null): card still possible, cash refused by the database
resetTaxCache(); catalogTaxes = null;
const savedFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => new URL(url).pathname === "/v2/catalog/list" ? new Response("", { status: 500 }) : savedFetch(url, options);
const unknownId = "3370583e-d739-4684-82bb-004122a628ec";
assert.equal((await W({ action: "create", id: unknownId, eventMenu: "salsa", name: "U", items })).code, 201);
assert.equal(rows.get(unknownId).tax_cents, null);
globalThis.fetch = savedFetch;
process.env.SALES_TAX_BASIS_POINTS = "0";

// ── Cash actions ─────────────────────────────────────────────────────────────
const shiftId = "4370583e-d739-4684-82bb-004122a628ec";
assert.equal((await W({ action: "pay_cash", id, shiftId, totalCents: 2598, receivedCents: 4000 })).code, 400);   // no operator
rpcResult = { order_id: "o1", total_cents: 2598, received_cents: 4000, change_cents: 1402, repeat: false };
const paid = await W({ action: "pay_cash", id, shiftId, totalCents: 2598, receivedCents: 4000, operator: "Dani" });
assert.equal(paid.code, 200);
assert.equal(paid.data.result.change_cents, 1402);
assert.deepEqual(rpcCalls.at(-1), { name: "pay_walkup_cash", args: { p_id: id, p_shift: shiftId, p_expected_total_cents: 2598, p_received_cents: 4000, p_actor: "Dani" } });
// Database refusal (underpay, open card attempt) reaches the cashier as a 409 with its message
rpcError = { code: "P0001", message: "Cash received is less than the amount due" };
const under = await W({ action: "pay_cash", id, shiftId, totalCents: 2598, receivedCents: 2500, operator: "Dani" });
assert.equal(under.code, 409);
assert.match(under.data.error, /less than the amount due/);
rpcError = null;
assert.equal((await W({ action: "pay_cash", id, shiftId, totalCents: -1, receivedCents: 4000, operator: "Dani" })).code, 400);

// Manager-only actions when a manager code is configured
process.env.WALKUP_MANAGER_CODE = "manager-code-1";
const refund = { action: "cash_refund", id, shiftId, refundId: "5370583e-d739-4684-82bb-004122a628ec", amountCents: 1299, reason: "Spilled", operator: "Dani" };
assert.equal((await W(refund)).code, 403);
rpcResult = 1299;
assert.equal((await W(refund, { ...staff, "x-manager-code": "manager-code-1" })).code, 200);
assert.equal(rpcCalls.at(-1).args.p_key, "refund:5370583e-d739-4684-82bb-004122a628ec");
assert.equal((await W({ action: "close_shift", id: "6370583e-d739-4684-82bb-004122a628ec", shiftId, denominations: { 10000: 1, 2000: -1 }, operator: "R" },
  { ...staff, "x-manager-code": "manager-code-1" })).code, 400);
delete process.env.WALKUP_MANAGER_CODE;
assert.equal((await W({ action: "open_shift", id: "7370583e-d739-4684-82bb-004122a628ec", eventLabel: "Salsa Night", floatCents: 10000, operator: "Dani" })).code, 200);
assert.equal(rpcCalls.at(-1).args.p_float_cents, 10000);

// Recovery by ID after a dropped connection
rows.get(id).status = "paid"; rows.get(id).tender = "cash"; rows.get(id).change_cents = 1402;
const recovered = await W({ action: "cash_status", id });
assert.equal(recovered.data.order.change_cents, 1402);

// Staff code is required everywhere
assert.equal((await W({ action: "pay_cash", id, shiftId, totalCents: 2598, receivedCents: 4000, operator: "Dani" }, { "x-walkup-code": "wrong" })).code, 401);

// ── Bartender board: staff only, validated status changes ─────────────────────
assert.equal((await call(bartender, { method: "GET" })).code, 401);
const board = await call(bartender, { method: "GET", headers: staff });
assert.equal(board.code, 200);
const cookie = board.headers["Set-Cookie"].split(";")[0];
assert.match(board.headers["Set-Cookie"], /Path=\/api;/);
assert.equal((await call(bartender, { method: "GET", headers: { cookie } })).code, 200);   // shared session
assert.equal((await call(bartender, { body: { id: orders[0].id, status: "deleted" }, headers: staff })).code, 400);
const moved = await call(bartender, { body: { id: orders[0].id, status: "in_progress", barStation: "white_bar" }, headers: staff });
assert.equal(moved.code, 200);
assert.equal(orders[0].status, "In Progress");

// ── Guest tracker: by order id, no phone number ───────────────────────────────
const track = await call(drinkCheckout, { method: "GET", query: { order: orders[0].id } });
assert.equal(track.code, 200);
assert.equal(track.data.order.phone, undefined);
assert.equal((await call(drinkCheckout, { method: "GET", query: { order: "not-an-id" } })).code, 400);

// ── Ready text: staff only, never to a number that isn't on a real order ──────
assert.equal((await call(sms, { body: { orderId: orders[0].id }, headers: { "x-bartender-pin": "1234" } })).code, 401);
assert.equal((await call(sms, { body: { phone: "+15550001111", orderId: "nope" }, headers: staff })).code, 400);
assert.equal(twilioCalls, 0);

console.log("Cash register, bartender board, tracker and SMS checks passed with mocked Supabase and Square.");
