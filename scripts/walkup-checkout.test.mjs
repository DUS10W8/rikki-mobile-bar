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
const payment = { id: "test-payment", status: "APPROVED", source_type: "CARD", location_id: "bar",
  amount_money: { amount: 2300, currency: "USD" }, note };
globalThis.fetch = async (url, options) => {
  const { pathname, searchParams } = new URL(url);
  const json = Response.json;
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "POST") {
    checkout ??= { ...JSON.parse(options.body), status: "waiting" };
    return json([]);
  }
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "PATCH") {
    if (searchParams.get("status") !== "eq." + checkout.status) return json([]);
    Object.assign(checkout, JSON.parse(options.body));
    return json([checkout]);
  }
  if (pathname.endsWith("/transactions/transaction-1")) return json({ transaction: { tenders: [{ id: payment.id, note }] } });
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

async function call(body, staffCode = code) {
  const res = { setHeader() {}, status(value) { this.code = value; return this; }, json(data) { this.data = data; } };
  await handler({ method: "POST", headers: { "x-walkup-code": staffCode }, body: { id, ...body } }, res);
  return res;
}
const create = { action: "create", name: "Alex", items: [
  { id: "atlas-espresso-martini", quantity: 1 },
  { id: "atlas-classic-hot-cocoa", quantity: 2 },
] };
assert.equal((await call(create, "wrong")).code, 401);
assert.equal((await call(create)).code, 201);
assert.equal(checkout.amount_cents, 2300);
const opened = await call({ action: "open" });
assert.equal(opened.code, 200);
const request = JSON.parse(new URL(opened.data.url).searchParams.get("data"));
assert.equal(request.amount_money.amount, 2300);
assert.equal(request.notes, note);
assert.equal(request.callback_url, "https://www.example.test/bartender");
assert.equal((await call({ action: "open" })).code, 409);
const verify = { action: "verify", transactionId: "transaction-1" };
assert.equal((await call(verify)).code, 409);
payment.status = "COMPLETED";
payment.note = "unrelated payment";
assert.equal((await call(verify)).code, 409);
payment.note = note;
payment.amount_money.amount = 2200;
assert.equal((await call(verify)).code, 409);
payment.amount_money.amount = 2300;
assert.equal((await call(verify)).code, 200);
assert.equal((await call(verify)).code, 200);
assert.equal(releases, 1);
console.log("Walk-up checkout tests passed with mocked Square and Supabase.");
