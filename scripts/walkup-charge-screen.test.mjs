import assert from "node:assert/strict";
import handler from "../api/walkup-checkout.js";

// The bar iPhone gets a one-tap Square POS link only for fresh card attempts.
const code = "a-test-staff-code-only";
Object.assign(process.env, {
  WALKUP_STAFF_CODE: code, SQUARE_POS_APPLICATION_ID: "example",
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://www.example.test",
});
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
const rows = [
  { id: "1370583e-d739-4684-82bb-004122a628e1", name: "New", amount_cents: 1300, status: "opened", created_at: minutesAgo(1) },
  { id: "1370583e-d739-4684-82bb-004122a628e2", name: "Old", amount_cents: 800, status: "opened", created_at: minutesAgo(30) },
  { id: "1370583e-d739-4684-82bb-004122a628e3", name: "Cash", amount_cents: 800, status: "waiting", created_at: minutesAgo(1) },
  { id: "1370583e-d739-4684-82bb-004122a628e4", name: "Done", amount_cents: 800, status: "paid", created_at: minutesAgo(1) },
];
globalThis.fetch = async (url, options) => {
  const { pathname } = new URL(url);
  if (pathname === "/rest/v1/walkup_checkouts" && options.method === "GET") return Response.json(rows);
  throw Error(pathname);
};

const res = { setHeader() {}, status(value) { this.code = value; return this; }, json(data) { this.data = data; } };
await handler({ method: "GET", query: {}, headers: { "x-walkup-code": code, "x-walkup-request": "1" } }, res);
assert.equal(res.code, 200);
const [fresh, stale, cash, paid] = res.data.orders;
assert.ok(fresh.pos_url.startsWith("square-commerce-v1://payment/create?data="));
const request = JSON.parse(new URL(fresh.pos_url).searchParams.get("data"));
assert.equal(request.amount_money.amount, 1300);
assert.equal(request.state, fresh.id);
assert.equal(request.notes, "Rikkis walk-up " + fresh.id);
assert.equal(stale.pos_url, undefined, "a 30-minute-old attempt is not offered again");
assert.equal(cash.pos_url, undefined, "waiting orders may be cash sales");
assert.equal(paid.pos_url, undefined);
