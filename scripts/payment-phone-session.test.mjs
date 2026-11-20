import assert from "node:assert/strict";
import walkup from "../api/walkup-checkout.js";
import board from "../api/bartender-orders.js";
import sms from "../api/send-ready-sms.js";

// The guest-facing payment iPhone gets a limited session: card charges only.
const code = "a-test-staff-code-only";
Object.assign(process.env, {
  WALKUP_STAFF_CODE: code, SQUARE_POS_APPLICATION_ID: "example",
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake",
  SQUARE_ACCESS_TOKEN: "fake", SQUARE_LOCATION_ID: "bar", ORDER_SITE_URL: "https://www.example.test",
  SALES_TAX_BASIS_POINTS: "890",
});
globalThis.fetch = async (url) => {
  const { pathname } = new URL(url);
  if (pathname === "/rest/v1/walkup_checkouts" || pathname === "/rest/v1/orders") return Response.json([]);
  throw Error("unexpected " + pathname);
};
const id = "1370583e-d739-4684-82bb-004122a628ec";
async function call(handler, { method = "POST", headers = {}, body } = {}) {
  const res = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(value) { this.code = value; return this; },
    json(data) { this.data = data; }, end() {} };
  await handler({ method, query: {}, headers: { "x-walkup-request": "1", ...headers }, body }, res);
  return res;
}

// Unlocking from the phone screen issues a phone-scoped cookie.
const unlocked = await call(walkup, { method: "GET", headers: { "x-walkup-code": code, "x-walkup-scope": "phone" } });
assert.equal(unlocked.code, 200);
assert.equal(unlocked.data.scope, "phone");
assert.equal(unlocked.data.taxBasisPoints, undefined);
const phone = unlocked.headers["Set-Cookie"].split(";")[0];
assert.match(phone, /^rikki_walkup=\d{10}\.phone\.[0-9a-f]{64}$/);

// It can list charges, but nothing else.
assert.equal((await call(walkup, { method: "GET", headers: { cookie: phone } })).code, 200);
for (const action of ["create", "cancel", "archive", "pay_cash", "open_shift", "cash_refund", "drawer_movement", "close_shift"]) {
  assert.equal((await call(walkup, { headers: { cookie: phone }, body: { id, action } })).code, 403, action);
}
assert.equal((await call(board, { method: "GET", headers: { cookie: phone } })).code, 401, "board shows phone numbers");
assert.equal((await call(sms, { headers: { cookie: phone }, body: {} })).code, 401, "texts guests");

// A forged upgrade (phone signature presented as a staff cookie) is rejected.
const [expiry, , sig] = phone.split("=")[1].split(".");
assert.equal((await call(board, { method: "GET", headers: { cookie: `rikki_walkup=${expiry}.${sig}` } })).code, 401);

// The register iPad keeps a full session and gets the tax rate for totals.
const staff = await call(walkup, { method: "GET", headers: { "x-walkup-code": code } });
assert.equal(staff.data.scope, "staff");
assert.equal(staff.data.taxBasisPoints, 890);
const staffCookie = staff.headers["Set-Cookie"].split(";")[0];
assert.equal((await call(board, { method: "GET", headers: { cookie: staffCookie } })).code, 200);

// A phone still holding an old staff cookie can step down to a phone session.
const down = await call(walkup, { headers: { cookie: staffCookie }, body: { id, action: "phone_session" } });
assert.equal(down.code, 200);
assert.match(down.headers["Set-Cookie"], /\.phone\./);
