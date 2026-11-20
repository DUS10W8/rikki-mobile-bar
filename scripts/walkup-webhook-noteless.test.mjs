import assert from "node:assert/strict";
import handler from "../api/drink-checkout.js";

// Square's payment notification confirms a note-less Square POS walk-up charge on its own,
// so nobody at the register has to approve it.
Object.assign(process.env, {
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake", SQUARE_ACCESS_TOKEN: "fake",
  SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://example.test",
});
const id = "aca97bdd-5f60-4539-a419-bb8e69b487f9";
const order = (overrides = {}) => ({ id, created_at: new Date(Date.now() - 60000).toISOString(), amount_cents: 299, tax_cents: 26, status: "opened", ...overrides });
let state;
const reset = (waiting = [order()], extra = {}) => {
  state = { waiting, used: [], qr: null, released: [], ...extra,
    payment: { id: "pay-9", status: "COMPLETED", source_type: "CARD", location_id: "bar", order_id: "sq-9",
      amount_money: { amount: 325, currency: "USD" }, created_at: new Date().toISOString() } };
};
globalThis.fetch = async (url, options = {}) => {
  const { pathname, searchParams } = new URL(url);
  if (pathname === "/rest/v1/drink_checkouts") return Response.json(state.qr ? [state.qr] : []);
  if (pathname === "/rest/v1/walkup_checkouts" && searchParams.get("payment_id")) return Response.json(state.used);
  if (pathname === "/rest/v1/walkup_checkouts" && searchParams.get("status") === "eq.opened") return Response.json(state.waiting);
  if (pathname === "/rest/v1/walkup_checkouts") return Response.json([{ amount_cents: 299 }]);
  if (pathname === "/v2/payments/pay-9") return Response.json({ payment: state.payment });
  if (pathname === "/v2/orders/sq-9") return Response.json({ order: { id: "sq-9", location_id: "bar",
    total_money: { amount: 325, currency: "USD" }, total_tax_money: { amount: 26, currency: "USD" }, total_tip_money: { amount: 0, currency: "USD" } } });
  if (pathname === "/rest/v1/rpc/release_paid_walkup") {
    state.released.push(JSON.parse(options.body).p_id);
    return Response.json(true);
  }
  throw Error("unexpected " + pathname);
};
const notify = async () => {
  const res = { setHeader() {}, status(value) { this.code = value; return this; }, json(data) { this.data = data; }, end() {} };
  await handler({ method: "POST", headers: {}, body: { type: "payment.updated",
    data: { object: { payment: { id: "pay-9", order_id: "sq-9", status: "COMPLETED" } } } } }, res);
  return res;
};

// The live case: $2.99 + 26¢ tax = $3.25, one order waiting for card → released automatically.
reset();
assert.equal((await notify()).code, 204);
assert.deepEqual(state.released, [id]);

// Two waiting orders fit the same amount → left for the phone, which knows the exact transaction.
reset([order(), order({ id: "1370583e-d739-4684-82bb-004122a628ec" })]);
await notify();
assert.deepEqual(state.released, []);

// Payment already used by another walk-up order → not released.
reset(undefined, { used: [{ id: "other" }] });
await notify();
assert.deepEqual(state.released, []);

// A guest QR checkout's payment still goes to the QR path, never a walk-up order.
reset(undefined, { qr: { square_order_id: "sq-9", amount_cents: 325 } });
state.payment.status = "APPROVED";
await notify().catch(() => {});
assert.deepEqual(state.released, []);

// No waiting order at that amount → nothing released.
reset([order({ amount_cents: 999, tax_cents: 87 })]);
await notify();
assert.deepEqual(state.released, []);
