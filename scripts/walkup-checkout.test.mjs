import assert from "node:assert/strict";
import handler from "../api/walkup-checkout.js";

const code = "a-test-staff-code-only";
const id = "1370583e-d739-4684-82bb-004122a628ec";
const note = "Rikkis walk-up " + id;
Object.assign(process.env, {
  WALKUP_STAFF_CODE: code, SQUARE_POS_APPLICATION_ID: "example",
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://www.example.test",
});
let checkout;
let releases = 0;
let orderTip = 0;
let tenderNote = note;
const payment = { id: "test-payment", status: "APPROVED", source_type: "CARD", location_id: "bar",
  amount_money: { amount: 2900, currency: "USD" }, note };
globalThis.fetch = async (url, options) => {
  const { pathname, searchParams } = new URL(url);
  const json = Response.json;
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "POST") {
    checkout ??= { ...JSON.parse(options.body), status: "waiting" };
    return json([]);
  }
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "GET") {
    return json([{ status: checkout.status, amount_cents: checkout.amount_cents, created_at: "2026-11-07T20:00:00Z" }]);
  }
  if (pathname === "/v2/orders/square-order-1") return json({ order: { id: "square-order-1", location_id: "bar", total_money: { amount: 2944 + orderTip, currency: "USD" }, total_tip_money: { amount: orderTip, currency: "USD" }, total_tax_money: { amount: 44, currency: "USD" } } });
  if (pathname === "/v2/payments") return json({ payments: [payment] });
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "PATCH") {
    if (searchParams.get("status") !== "eq." + checkout.status) return json([]);
    Object.assign(checkout, JSON.parse(options.body));
    return json([checkout]);
  }
  if (pathname.includes("/transactions/")) return json({ transaction: { tenders: [{ id: payment.id, note: tenderNote }] } });
  if (pathname === "/v2/payments/test-payment") return json({ payment });
  if (pathname === "/rest/v1/rpc/release_paid_walkup") {
    const body = JSON.parse(options.body);
    if (body.p_id !== checkout.id || body.p_amount_cents !== checkout.amount_cents) return json(false);
    if (checkout.status === "opened") {
      checkout.status = "paid";
      releases += 1;
    }
    return json(true);
  }
  throw Error(pathname);
};

async function call(body, staffCode = code, cookie) {
  const res = { setHeader(name, value) { if (name === "Set-Cookie") this.cookie = value; }, status(value) { this.code = value; return this; }, json(data) { this.data = data; } };
  await handler({ method: "POST", headers: { "x-walkup-code": staffCode, "x-walkup-request": "1", cookie }, body: { id, ...body } }, res);
  return res;
}
const create = { action: "create", name: "Alex", items: [
  { id: "hamilton-sweater-weather", quantity: 1 },
  { id: "hamilton-cozy-cocoa", quantity: 2 },
] };
assert.equal((await call(create, "wrong")).code, 401);
const signedIn = await call(create);
assert.equal(signedIn.code, 201);
assert.match(signedIn.cookie, /HttpOnly; Secure; SameSite=Lax/);
const cookie = signedIn.cookie.split(";")[0];
assert.equal((await call(create, "", cookie)).code, 201);
assert.equal((await call(create, "", cookie + "0")).code, 401);
assert.match((await call({ action: "lock" }, "", cookie)).cookie, /Max-Age=0/);
assert.equal(checkout.amount_cents, 2900);
const opened = await call({ action: "open" });
assert.equal(opened.code, 200);
const request = JSON.parse(new URL(opened.data.url).searchParams.get("data"));
assert.equal(request.amount_money.amount, 2900);
assert.equal(request.notes, note);
assert.equal(request.callback_url, "https://www.example.test/bartender");
assert.equal((await call({ action: "open" })).code, 409);
const verify = { action: "verify", transactionId: "transaction-1" };
assert.equal((await call(verify)).code, 409);
payment.status = "COMPLETED";
payment.note = "unrelated payment";
tenderNote = "unrelated tender";
assert.equal((await call(verify)).code, 409);
payment.note = note;
payment.amount_money.amount = 2200;
assert.equal((await call(verify)).code, 409);
payment.order_id = "square-order-1";
payment.amount_money.amount = 2945;
assert.equal((await call({ action: "reconcile" })).code, 409);
payment.amount_money.amount = 2944;
orderTip = 200;
payment.tip_money = { amount: 199, currency: "USD" };
assert.equal((await call({ action: "reconcile" })).code, 409);
payment.tip_money.amount = 200;
payment.note = "";
tenderNote = note;
assert.equal((await call({ action: "reconcile" })).code, 200);
assert.equal((await call(verify)).code, 200);
assert.equal(releases, 1);
console.log("Walk-up checkout tests passed with mocked Square and Supabase.");
