import { createHmac, timingSafeEqual } from "node:crypto";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { squareRequest } from "../src/server/square.js";
import { isWalkupId, releaseWalkupPayment, walkupNotePrefix } from "../src/server/walkupPayment.js";

const { drinks } = createRequire(import.meta.url)("../src/order/eventMenu.json");
const fields = "id,name,drink,amount_cents,status";
const squareId = /^[a-zA-Z0-9_-]{1,192}$/;

function hasStaffAccess(value, expected) {
  if (typeof value !== "string" || value.length > 128) return false;
  const supplied = Buffer.from(value.trim());
  const secret = Buffer.from(expected.trim());
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

const sessionName = "rikki_walkup";
const sessionSeconds = 12 * 60 * 60;

function sessionSignature(expiry, secret) {
  return createHmac("sha256", secret.trim()).update("walkup:" + expiry).digest("hex");
}

function hasSession(cookieHeader, secret) {
  const value = cookieHeader?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(sessionName + "="));
  const [expiry, signature] = value?.slice(sessionName.length + 1).split(".") ?? [];
  if (!/^\d{10}$/.test(expiry ?? "") || Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  return hasStaffAccess(signature, sessionSignature(expiry, secret));
}

function setSession(res, secret, maxAge) {
  const expiry = Math.floor(Date.now() / 1000) + maxAge;
  const value = maxAge ? expiry + "." + sessionSignature(expiry, secret) : "";
  res.setHeader("Set-Cookie", sessionName + "=" + value + "; Path=/api/walkup-checkout; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax");
}

async function createWalkup(db, body, res) {
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > drinks.length ||
      typeof body.name !== "string" || body.name.length > 80) {
    return res.status(400).json({ error: "Choose at least one drink." });
  }
  const selected = new Map();
  for (const item of body.items) {
    const drink = drinks.find(({ id }) => id === item?.id);
    if (!drink || selected.has(drink.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return res.status(400).json({ error: "Check the selected drinks and quantities." });
    }
    selected.set(drink.id, { drink, quantity: item.quantity });
  }
  const order = [...selected.values()];
  const drink = order.map(({ drink, quantity }) => `${quantity} × ${drink.name}`).join(", ");
  if (drink.length > 250) return res.status(400).json({ error: "Split this order into smaller groups of drinks." });
  const amount = order.reduce((total, item) => total + item.quantity * item.drink.priceCents, 0);
  const { error } = await db.from("walkup_checkouts").upsert({
    id: body.id, name: body.name.trim() || "Walk-up guest", drink, amount_cents: amount,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  return res.status(201).json({ ok: true });
}

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
  const validCode = hasStaffAccess(req.headers["x-walkup-code"], WALKUP_STAFF_CODE);
  if (!validCode && !hasSession(req.headers.cookie, WALKUP_STAFF_CODE)) {
    return res.status(401).json({ error: "Enter the walk-up staff code." });
  }

  if (validCode) setSession(res, WALKUP_STAFF_CODE, sessionSeconds);
  const db = createClient(dbUrl, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("walkup_checkouts").select(fields)
        .is("archived_at", null).in("status", ["waiting", "opened", "paid"]).order("created_at", { ascending: false }).limit(25);
      if (error) throw error;
      return res.status(200).json({ orders: data });
    }
    if (req.method !== "POST") return res.status(405).end();
    const body = req.body ?? {};
    if (!isWalkupId(body.id)) return res.status(400).json({ error: "Invalid walk-up order." });
    if (body.action === "create") return await createWalkup(db, body, res);
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
      const request = {
        amount_money: { amount: data.amount_cents, currency_code: "USD" },
        callback_url: new URL("/bartender", ORDER_SITE_URL).href,
        client_id: SQUARE_POS_APPLICATION_ID,
        location_id: SQUARE_LOCATION_ID,
        version: "1.3",
        state: data.id,
        notes: walkupNotePrefix + data.id,
        options: { supported_tender_types: ["CREDIT_CARD"], auto_return: true },
      };
      return res.status(200).json({ url: "square-commerce-v1://payment/create?data=" + encodeURIComponent(JSON.stringify(request)) });
    }
    if (body.action === "reconcile") {
      const { data: checkout, error } = await db.from("walkup_checkouts")
        .select("created_at,status,amount_cents").eq("id", body.id).maybeSingle();
      if (error) throw error;
      if (checkout?.status === "paid") return res.status(200).json({ ok: true });
      if (checkout?.status !== "opened") return res.status(409).json({ error: "Open checkout before checking for a payment." });
      const query = new URLSearchParams({
        location_id: SQUARE_LOCATION_ID, begin_time: new Date(checkout.created_at).toISOString(), limit: "100",
      });
      const note = walkupNotePrefix + body.id;
      for (let page = 0; page < 5; page += 1) {
        const { payments, cursor } = await squareRequest("payments?" + query);
        for (const payment of payments ?? []) {
          if (payment.status !== "COMPLETED" || payment.source_type !== "CARD" ||
              payment.amount_money?.amount < checkout.amount_cents) continue;
          let matched = payment.note === note;
          if (!matched && payment.order_id) {
            // Square POS can record the note on the transaction tender.
            const { transaction } = await squareRequest(`locations/${encodeURIComponent(SQUARE_LOCATION_ID)}/transactions/${encodeURIComponent(payment.order_id)}`)
              .catch(() => ({}));
            matched = transaction?.tenders?.some((tender) =>
              (tender.payment_id || tender.id) === payment.id && tender.note === note) ?? false;
          }
          if (matched && await releaseWalkupPayment(db, { ...payment, note })) {
            return res.status(200).json({ ok: true });
          }
        }
        if (!cursor) break;
        query.set("cursor", cursor);
      }
      return res.status(409).json({ error: "No completed Square payment could be matched to this order. If Square shows a charge, keep the receipt and do not pay again." });
    }
    if (body.action === "verify" && typeof body.transactionId === "string" && squareId.test(body.transactionId)) {
      const { transaction } = await squareRequest(`locations/${encodeURIComponent(SQUARE_LOCATION_ID)}/transactions/${body.transactionId}`);
      for (const tender of transaction?.tenders ?? []) {
        const paymentId = tender.payment_id || tender.id;
        if (!paymentId) continue;
        const { payment } = await squareRequest(`payments/${encodeURIComponent(paymentId)}`);
        const note = walkupNotePrefix + body.id;
        if (payment && (payment.note === note || tender.note === note) && await releaseWalkupPayment(db, { ...payment, note })) {
          return res.status(200).json({ ok: true });
        }
      }
      return res.status(409).json({ error: "Square has not confirmed this payment. Check the Square transaction before retrying." });
    }
    return res.status(400).json({ error: "Invalid walk-up action." });
  } catch (error) {
    console.error("Walk-up checkout failed", error.code || error.message);
    return res.status(502).json({ error: "Could not reach Square or the order queue." });
  }
}
