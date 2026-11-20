import assert from "node:assert/strict";
import handler from "../api/walkup-checkout.js";

// Square POS drops the note we send. Live test, Nov 19: payment COMPLETED/CARD $4.34, no note,
// with a Square order, for a $3.99 subtotal. It must be accepted when it is new and unused.
const code = "a-test-staff-code-only";
Object.assign(process.env, {
  WALKUP_STAFF_CODE: code, SQUARE_POS_APPLICATION_ID: "example",
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://www.example.test",
});
const id = "8bad55ec-d76b-4991-89a3-85c274720a6f";
const rungAt = new Date(Date.now() - 2 * 60000).toISOString();
let state;
function reset(overrides = {}) {
  state = {
    checkout: { id, status: "opened", amount_cents: 399, tax_cents: 35, created_at: rungAt },
    payment: { id: "pay-1", status: "COMPLETED", source_type: "CARD", location_id: "bar", order_id: "sq-order-1",
      amount_money: { amount: 434, currency: "USD" }, created_at: new Date().toISOString() },
    usedBy: [], qrOrders: [], released: 0, ...overrides,
  };
}
globalThis.fetch = async (url, options = {}) => {
  const { pathname, searchParams } = new URL(url);
  if (pathname === "/rest/v1/walkup_checkouts" && searchParams.get("payment_id")) return Response.json(state.usedBy);
  if (pathname === "/rest/v1/walkup_checkouts") return Response.json([state.checkout]);
  if (pathname === "/rest/v1/drink_checkouts") return Response.json(state.qrOrders);
  if (pathname === "/rest/v1/rpc/release_paid_walkup") {
    const body = JSON.parse(options.body);
    const ok = body.p_id === id && body.p_amount_cents === 399 && body.p_payment_id === "pay-1" && state.checkout.status === "opened";
    if (ok) { state.checkout.status = "paid"; state.released += 1; }
    return Response.json(ok);
  }
  if (pathname === "/v2/orders/sq-order-1") return Response.json({ order: { id: "sq-order-1", location_id: "bar",
    tenders: [{ id: "pay-1", payment_id: "pay-1" }], total_money: { amount: 434, currency: "USD" },
    total_tax_money: { amount: 35, currency: "USD" }, total_tip_money: { amount: 0, currency: "USD" } } });
  if (pathname.includes("/transactions/")) return Response.json({});
  if (pathname === "/v2/payments/pay-1") return Response.json({ payment: state.payment });
  if (pathname === "/v2/payments") return Response.json({ payments: [state.payment] });
  throw Error("unexpected " + pathname);
};
async function call(body) {
  const res = { setHeader() {}, status(value) { this.code = value; return this; }, json(data) { this.data = data; } };
  await handler({ method: "POST", headers: { "x-walkup-code": code, "x-walkup-request": "1", "x-walkup-scope": "phone" }, body: { id, ...body } }, res);
  return res;
}

// The phone's verify, with the transaction Square returned: accepted.
reset();
assert.equal((await call({ action: "verify", transactionId: "sq-order-1" })).code, 200);
assert.equal(state.released, 1);

// Reconcile (no transaction id), one note-less payment that fits the total with tax: accepted.
reset();
assert.equal((await call({ action: "reconcile" })).code, 200);
assert.equal(state.released, 1);

// Payment made before this order was rung: refused, with the reason.
reset();
state.payment.created_at = new Date(Date.now() - 60 * 60000).toISOString();
let res = await call({ action: "verify", transactionId: "sq-order-1" });
assert.equal(res.code, 409);
assert.match(res.data.detail, /within 30 minutes/);
assert.equal(state.released, 0);

// Payment already used by another walk-up order: refused.
reset({ usedBy: [{ id: "other" }] });
res = await call({ action: "verify", transactionId: "sq-order-1" });
assert.equal(res.code, 409);
assert.match(res.data.detail, /already used/);

// Payment that belongs to a guest QR order: refused.
reset({ qrOrders: [{ id: "qr" }] });
res = await call({ action: "reconcile" });
assert.equal(res.code, 409);
assert.match(res.data.detail, /guest QR order/);

// A payment carrying another order's note is never taken.
reset();
state.payment.note = "Rikkis walk-up 00000000-0000-4000-8000-000000000000";
res = await call({ action: "verify", transactionId: "sq-order-1" });
assert.equal(res.code, 409);
assert.equal(state.released, 0);

// Reconcile refuses a note-less payment whose amount doesn't fit this order.
reset();
state.payment.amount_money.amount = 999;
assert.equal((await call({ action: "reconcile" })).code, 409);
assert.equal(state.released, 0);
