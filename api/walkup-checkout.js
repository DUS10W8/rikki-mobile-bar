import { createClient } from "@supabase/supabase-js";
import { squareRequest } from "../src/server/square.js";
import { isWalkupId, releaseWalkupPayment, unclaimedReason, walkupNotePrefix } from "../src/server/walkupPayment.js";
import { authorizeWalkup, hasManagerAccess, setSession } from "../src/server/staffSession.js";
import { salesTaxBasisPoints, taxCents } from "../src/server/tax.js";

import { activeMenuId, menus } from "../src/server/menus.js";
const fields = "id,name,drink,items,amount_cents,tax_cents,status,tender,cash_received_cents,change_cents,order_id,created_at";
const squareId = /^[a-zA-Z0-9_-]{1,192}$/;

async function createWalkup(db, body, res) {
  const menu = menus[body.eventMenu ?? activeMenuId];
  if (!menu) return res.status(400).json({ error: "Choose an event menu." });
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > menu.length ||
      typeof body.name !== "string" || body.name.length > 80) {
    return res.status(400).json({ error: "Choose at least one drink." });
  }
  const selected = new Map();
  for (const item of body.items) {
    const drink = menu.find(({ id }) => id === item?.id);
    if (!drink || selected.has(drink.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return res.status(400).json({ error: "Check the selected drinks and quantities." });
    }
    selected.set(drink.id, { drink, quantity: item.quantity });
  }
  const order = [...selected.values()];
  const drink = order.map(({ drink, quantity }) => `${quantity} × ${drink.name}`).join(", ");
  if (drink.length > 250) return res.status(400).json({ error: "Split this order into smaller groups of drinks." });
  const amount = order.reduce((total, item) => total + item.quantity * item.drink.priceCents, 0);
  // Tax is fixed when the order is rung, from the server's rule. Null = rule unavailable:
  // card still works (Square adds tax), cash is refused until the order is rung again.
  const basisPoints = await salesTaxBasisPoints().catch((error) => {
    console.error("Sales tax lookup failed", error.message);
    return null;
  });
  const { error } = await db.from("walkup_checkouts").upsert({
    id: body.id, name: body.name.trim() || "Walk-up guest", drink, amount_cents: amount,
    tax_basis_points: basisPoints, tax_cents: basisPoints === null ? null : taxCents(amount, basisPoints),
    // Structured lines: the database deducts each item's recipe from stock when payment releases the ticket.
    items: order.map(({ drink, quantity }) => ({ id: drink.id, name: drink.name, quantity, price_cents: drink.priceCents })),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  // Return what is stored, so a retried create reports the original totals.
  const { data: saved, error: readError } = await db.from("walkup_checkouts").select(fields).eq("id", body.id).maybeSingle();
  if (readError) throw readError;
  return res.status(201).json({ ok: true, order: saved });
}

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const operatorOf = (body) => typeof body.operator === "string" && body.operator.trim().length >= 1 && body.operator.length <= 60
  ? body.operator.trim() : null;
const cents = (value, max = 1000000) => Number.isInteger(value) && value >= 0 && value <= max ? value : null;

// Database rules raise plain-language messages; pass those to the cashier as a 409.
async function rpc(db, res, name, args, shape = (data) => data) {
  const { data, error } = await db.rpc(name, args);
  if (error) {
    if (error.code === "P0001" || error.code === "23505") return res.status(409).json({ error: error.message });
    throw error;
  }
  return res.status(200).json(shape(data));
}

const cashActions = ["open_shift", "pay_cash", "drawer_movement", "cash_refund", "close_shift"];

async function cashAction(db, req, body, res) {
  if (!cashActions.includes(body.action)) return null;
  const operator = operatorOf(body);
  if (!operator) return res.status(400).json({ error: "Enter your name as the operator." });
  const managerOnly = ["drawer_movement", "cash_refund", "close_shift"].includes(body.action);
  if (managerOnly && !hasManagerAccess(req)) return res.status(403).json({ error: "A manager code is required for this." });
  const shiftId = typeof body.shiftId === "string" && uuid.test(body.shiftId) ? body.shiftId : null;

  switch (body.action) {
    case "open_shift": {
      const floatCents = cents(body.floatCents, 500000);
      const label = typeof body.eventLabel === "string" ? body.eventLabel.trim().slice(0, 80) : "";
      if (floatCents === null || !label) return res.status(400).json({ error: "Enter the event and the opening float." });
      return rpc(db, res, "open_cash_shift", { p_drawer: "main", p_event_label: label, p_float_cents: floatCents,
        p_actor: operator, p_key: "open:" + body.id }, (id) => ({ shiftId: id }));
    }
    case "pay_cash": {
      const total = cents(body.totalCents);
      const received = cents(body.receivedCents);
      if (!shiftId || total === null || received === null) return res.status(400).json({ error: "Enter the cash received." });
      return rpc(db, res, "pay_walkup_cash", { p_id: body.id, p_shift: shiftId, p_expected_total_cents: total,
        p_received_cents: received, p_actor: operator }, (result) => ({ result }));
    }
    case "drawer_movement": {
      const amount = cents(body.amountCents, 500000);
      if (!shiftId || !amount || !["paid_in", "payout", "drop"].includes(body.kind)) {
        return res.status(400).json({ error: "Choose paid in, payout or drop and an amount." });
      }
      return rpc(db, res, "record_drawer_movement", { p_shift: shiftId, p_kind: body.kind, p_amount_cents: amount,
        p_reason: String(body.reason ?? "").slice(0, 200), p_actor: operator, p_key: "move:" + body.id }, () => ({ ok: true }));
    }
    case "cash_refund": {
      const amount = cents(body.amountCents);
      if (!shiftId || !amount || typeof body.refundId !== "string" || !uuid.test(body.refundId)) {
        return res.status(400).json({ error: "Enter the refund amount." });
      }
      return rpc(db, res, "refund_walkup_cash", { p_id: body.id, p_shift: shiftId, p_amount_cents: amount,
        p_reason: String(body.reason ?? "").slice(0, 200), p_actor: operator, p_key: "refund:" + body.refundId },
        (refunded) => ({ refundedCents: refunded }));
    }
    case "close_shift": {
      const denominations = body.denominations;
      if (!shiftId || typeof denominations !== "object" || denominations === null || Array.isArray(denominations) ||
          Object.values(denominations).some((count) => cents(count, 10000) === null)) {
        return res.status(400).json({ error: "Enter a count for each bill and coin." });
      }
      return rpc(db, res, "close_cash_shift", { p_shift: shiftId, p_denominations: denominations,
        p_reason: String(body.reason ?? "").slice(0, 200), p_actor: operator, p_key: "close:" + body.id },
        (result) => ({ result }));
    }
    default:
      return null;
  }
}

async function shiftStatus(db) {
  const { data: shift, error } = await db.from("cash_shift_summary").select("*")
    .eq("drawer", "main").is("closed_at", null).maybeSingle();
  if (error) throw error;
  if (!shift) {
    const { data: last, error: lastError } = await db.from("cash_shift_summary").select("*")
      .eq("drawer", "main").not("closed_at", "is", null).order("closed_at", { ascending: false }).limit(1).maybeSingle();
    if (lastError) throw lastError;
    return { shift: null, lastClosed: last };
  }
  return { shift, lastClosed: null };
}

async function squareTenders(location, orderId) {
  const id = encodeURIComponent(orderId);
  const { order } = await squareRequest(`orders/${id}`).catch(() => ({}));
  const { transaction } = await squareRequest(`locations/${encodeURIComponent(location)}/transactions/${id}`)
    .catch(() => ({}));
  return [...(order?.tenders ?? []), ...(transaction?.tenders ?? [])];
}

// Square POS launch link for a card attempt. The iPhone shows it as a one-tap "Charge" screen,
// because iOS only opens another app from a tap.
function posUrl(row, env) {
  const request = {
    amount_money: { amount: row.amount_cents, currency_code: "USD" },
    callback_url: new URL("/bartender", env.ORDER_SITE_URL).href,
    client_id: env.SQUARE_POS_APPLICATION_ID,
    location_id: env.SQUARE_LOCATION_ID,
    version: "1.3",
    state: row.id,
    notes: walkupNotePrefix + row.id,
    options: { supported_tender_types: ["CREDIT_CARD"], auto_return: true },
  };
  return "square-commerce-v1://payment/create?data=" + encodeURIComponent(JSON.stringify(request));
}
// Older card attempts are not offered again: they need Find Square payment or Clear failed attempt.
const chargeWindowMs = 15 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { WALKUP_STAFF_CODE, SQUARE_POS_APPLICATION_ID, SQUARE_LOCATION_ID, SQUARE_ACCESS_TOKEN,
    ORDER_SITE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!WALKUP_STAFF_CODE || WALKUP_STAFF_CODE.trim().length < 16 || !SQUARE_POS_APPLICATION_ID ||
      !SQUARE_LOCATION_ID || !SQUARE_ACCESS_TOKEN || !ORDER_SITE_URL || !SUPABASE_SERVICE_ROLE_KEY || !dbUrl) {
    return res.status(503).json({ error: "Walk-up checkout has not been configured." });
  }
  if (req.headers["x-walkup-request"] !== "1") return res.status(403).json({ error: "Invalid walk-up request." });
  if (req.method === "POST" && req.body?.action === "lock") {
    setSession(res, WALKUP_STAFF_CODE, 0);
    return res.status(200).json({ ok: true });
  }
  const scope = authorizeWalkup(req, res);
  if (!scope) return res.status(401).json({ error: "Enter the walk-up staff code." });
  // The guest-facing iPhone can only list card charges, launch them and confirm them.
  if (scope === "phone" && req.method === "POST" && !["open", "verify", "reconcile"].includes(req.body?.action)) {
    return res.status(403).json({ error: "The payment phone can't do this. Use the register iPad." });
  }
  if (req.method === "POST" && req.body?.action === "phone_session") {
    setSession(res, WALKUP_STAFF_CODE, undefined, "phone");
    return res.status(200).json({ ok: true, scope: "phone" });
  }

  const db = createClient(dbUrl, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("walkup_checkouts").select(fields)
        .is("archived_at", null).in("status", ["waiting", "opened", "paid"]).order("created_at", { ascending: false }).limit(25);
      if (error) throw error;
      const now = Date.now();
      const orders = data.map((row) => row.status === "opened" && now - new Date(row.created_at).getTime() < chargeWindowMs
        ? { ...row, pos_url: posUrl(row, process.env) } : row);
      if (scope === "phone") return res.status(200).json({ orders, scope });
      const taxBasisPoints = await salesTaxBasisPoints().catch(() => null);
      return res.status(200).json({ orders, scope, taxBasisPoints, ...(req.query?.drawer ? await shiftStatus(db) : {}) });
    }
    if (req.method !== "POST") return res.status(405).end();
    const body = req.body ?? {};
    if (!isWalkupId(body.id)) return res.status(400).json({ error: "Invalid walk-up order." });
    if (body.action === "create") return await createWalkup(db, body, res);
    if (body.action === "cash_status") {
      // Recovery after a dropped connection: did this cash sale already go through?
      const { data, error } = await db.from("walkup_checkouts").select(fields).eq("id", body.id).maybeSingle();
      if (error) throw error;
      return res.status(data ? 200 : 404).json({ order: data });
    }
    const cash = await cashAction(db, req, body, res);
    if (cash !== null) return cash;
    if (body.action === "archive") {
      const { data, error } = await db.from("walkup_checkouts").update({ archived_at: new Date().toISOString() })
        .eq("id", body.id).eq("status", "opened").is("archived_at", null).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return res.status(409).json({ error: "This payment attempt has already changed. Refresh the list." });
      return res.status(200).json({ ok: true });
    }
    if (body.action === "cancel" || body.action === "open") {
      const { data, error } = await db.from("walkup_checkouts")
        .update({ status: body.action === "cancel" ? "cancelled" : "opened" })
        .eq("id", body.id).eq("status", "waiting").select(fields).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(409).json({ error: "This order is already being handled." });
      if (body.action === "cancel") return res.status(200).json({ ok: true });
      return res.status(200).json({ url: posUrl(data, process.env) });
    }
    if (body.action === "reconcile") {
      const { data: checkout, error } = await db.from("walkup_checkouts")
        .select("created_at,status,amount_cents,tax_cents").eq("id", body.id).maybeSingle();
      if (error) throw error;
      if (checkout?.status === "paid") return res.status(200).json({ ok: true });
      if (checkout?.status !== "opened") return res.status(409).json({ error: "Open checkout before checking for a payment." });
      const query = new URLSearchParams({
        location_id: SQUARE_LOCATION_ID, begin_time: new Date(checkout.created_at).toISOString(), limit: "100",
      });
      const note = walkupNotePrefix + body.id;
      const seen = [];   // what Square listed, so a failed match says why
      const why = [];
      const noteless = [];
      for (let page = 0; page < 5; page += 1) {
        const { payments, cursor } = await squareRequest("payments?" + query);
        for (const payment of payments ?? []) {
          seen.push(`${payment.status}/${payment.source_type} $${((payment.amount_money?.amount ?? 0) / 100).toFixed(2)}` +
            (payment.note ? ` note:${payment.note === note ? "match" : "other"}` : " no-note") + (payment.order_id ? " order" : ""));
          if (payment.status !== "COMPLETED" || payment.source_type !== "CARD" ||
              payment.amount_money?.amount < checkout.amount_cents) continue;
          const matched = payment.note === note || (payment.order_id &&
            (await squareTenders(SQUARE_LOCATION_ID, payment.order_id)).some((tender) =>
              (tender.payment_id || tender.id) === payment.id && tender.note === note));
          if (matched && await releaseWalkupPayment(db, { ...payment, note }, why)) {
            return res.status(200).json({ ok: true });
          }
          if (!matched && !payment.note) noteless.push(payment);
        }
        if (!cursor) break;
        query.set("cursor", cursor);
      }
      // No note match: accept a note-less payment only if exactly one unused one fits this order's total.
      const fits = [];
      for (const payment of noteless) {
        const amount = payment.amount_money?.amount;
        if (amount !== checkout.amount_cents && (checkout.tax_cents === null || Math.abs(amount - checkout.amount_cents - checkout.tax_cents) > 1)) continue;
        const reason = await unclaimedReason(db, payment, checkout, body.id);
        if (reason) why.push(reason); else fits.push(payment);
      }
      if (fits.length === 1 && await releaseWalkupPayment(db, { ...fits[0], note }, why)) return res.status(200).json({ ok: true });
      if (fits.length > 1) why.push(`${fits.length} unused payments fit this total; use the transaction on the phone, or check Square`);
      console.error("Walk-up reconcile found no match", body.id, checkout.amount_cents, why, seen.slice(0, 10));
      return res.status(409).json({ error: "No completed Square payment could be matched to this order. If Square shows a charge, keep the receipt and do not pay again.",
        detail: (why.length ? `Rejected: ${why.join("; ")}. ` : "") +
          `Subtotal $${(checkout.amount_cents / 100).toFixed(2)}. Square listed ${seen.length} payment(s) since this order: ${seen.slice(0, 5).join("; ") || "none"}` });
    }
    if (body.action === "verify" && typeof body.transactionId === "string" && squareId.test(body.transactionId)) {
      const why = [];
      const { data: checkout, error: checkoutError } = await db.from("walkup_checkouts")
        .select("created_at,status").eq("id", body.id).maybeSingle();
      if (checkoutError) throw checkoutError;
      if (checkout?.status === "paid") return res.status(200).json({ ok: true });
      const tenders = await squareTenders(SQUARE_LOCATION_ID, body.transactionId);
      if (!tenders.length) why.push("Square returned no tenders for this transaction");
      for (const tender of tenders) {
        const paymentId = tender.payment_id || tender.id;
        if (!paymentId) continue;
        const { payment } = await squareRequest(`payments/${encodeURIComponent(paymentId)}`);
        const note = walkupNotePrefix + body.id;
        if (!payment) continue;
        const noted = payment.note === note || tender.note === note;
        if (!noted && (payment.note || tender.note)) { why.push("payment note is for a different order"); continue; }
        // No note (Square POS drops it): Square returned this transaction to this order's own checkout.
        const reason = !noted && checkout ? await unclaimedReason(db, payment, checkout, body.id) : null;
        if (reason) { why.push(reason); continue; }
        if (await releaseWalkupPayment(db, { ...payment, note }, why)) return res.status(200).json({ ok: true });
      }
      console.error("Walk-up verify refused", body.id, why);
      return res.status(409).json({ error: "Square has not confirmed this payment. Check the Square transaction before retrying.", detail: why.join("; ") });
    }
    return res.status(400).json({ error: "Invalid walk-up action." });
  } catch (error) {
    console.error("Walk-up checkout failed", error.code || error.message);
    return res.status(502).json({ error: "Could not reach Square or the order queue." });
  }
}
