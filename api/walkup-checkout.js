import { timingSafeEqual } from "node:crypto";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { squareRequest } from "../src/server/square.js";
import { isWalkupId, releaseWalkupPayment, walkupNotePrefix } from "../src/server/walkupPayment.js";

const { drinks } = createRequire(import.meta.url)("../src/order/eventMenu.json");
const fields = "id,name,drink,amount_cents,status";
const squareId = /^[a-zA-Z0-9_-]{1,192}$/;

function hasStaffAccess(value, expected) {
  if (typeof value !== "string" || value.length > 128) return false;
  const supplied = Buffer.from(value);
  const secret = Buffer.from(expected);
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
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
  if (!WALKUP_STAFF_CODE || WALKUP_STAFF_CODE.length < 16 || !SQUARE_POS_APPLICATION_ID ||
      !SQUARE_LOCATION_ID || !SQUARE_ACCESS_TOKEN || !ORDER_SITE_URL || !SUPABASE_SERVICE_ROLE_KEY || !dbUrl) {
    return res.status(503).json({ error: "Walk-up checkout has not been configured." });
  }
  if (!hasStaffAccess(req.headers["x-walkup-code"], WALKUP_STAFF_CODE)) {
    return res.status(401).json({ error: "Enter the walk-up staff code." });
  }

  const db = createClient(dbUrl, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("walkup_checkouts").select(fields)
        .in("status", ["waiting", "opened", "paid"]).order("created_at", { ascending: false }).limit(25);
      if (error) throw error;
      return res.status(200).json({ orders: data });
    }
    if (req.method !== "POST") return res.status(405).end();
    const body = req.body ?? {};
    if (!isWalkupId(body.id)) return res.status(400).json({ error: "Invalid walk-up order." });
    if (body.action === "create") return await createWalkup(db, body, res);
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
    if (body.action === "verify" && typeof body.transactionId === "string" && squareId.test(body.transactionId)) {
      const { transaction } = await squareRequest(`locations/${encodeURIComponent(SQUARE_LOCATION_ID)}/transactions/${body.transactionId}`);
      for (const tender of transaction?.tenders ?? []) {
        const paymentId = tender.payment_id || tender.id;
        if (!paymentId) continue;
        const { payment } = await squareRequest(`payments/${encodeURIComponent(paymentId)}`);
        const note = payment?.note || tender.note;
        if (payment && note === walkupNotePrefix + body.id && await releaseWalkupPayment(db, { ...payment, note })) {
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
