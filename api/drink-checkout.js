import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { squareRequest as square } from "../src/server/square.js";
import { releaseWalkupPayment, walkupNotePrefix } from "../src/server/walkupPayment.js";

const { drinks } = createRequire(import.meta.url)("../src/order/eventMenu.json");
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const squareId = /^[a-zA-Z0-9_-]{1,192}$/;
const orderFields = "id,name,drink,table_number,handoff,status,bar_station,created_at,updated_at,square_order_id";

async function releaseIfPaid(db, checkout, payment) {
  if (payment.order_id !== checkout.square_order_id ||
      payment.status !== "COMPLETED" ||
      payment.location_id !== process.env.SQUARE_LOCATION_ID ||
      payment.amount_money?.currency !== "USD" ||
      payment.amount_money.amount !== checkout.amount_cents ||
      (payment.refunded_money?.amount ?? 0) > 0) return;

  const { error } = await db.rpc("release_paid_drink", { p_square_order_id: checkout.square_order_id });
  if (error) throw error;
}

async function startCheckout(db, req, res) {
  const { id, drinkId, items, name, phone, handoff, amountCents } = req.body ?? {};
  if (typeof id !== "string" || !uuid.test(id) ||
      typeof name !== "string" || name.trim().length < 2 || name.length > 80 ||
      typeof phone !== "string" || phone.length > 30 ||
      !['outdoor_pickup', 'upstairs'].includes(handoff)) {
    return res.status(400).json({ error: "Choose a drink and enter your name and handoff option." });
  }

  const requested = items === undefined ? [{ id: drinkId, quantity: 1 }] : items;
  if (!Array.isArray(requested) || !requested.length || requested.length > drinks.length) {
    return res.status(400).json({ error: "Choose at least one drink." });
  }
  const basket = new Map();
  for (const item of requested) {
    const drink = drinks.find(({ id }) => id === item?.id);
    if (!drink) return res.status(409).json({ error: "That drink is unavailable. Refresh the menu and choose again." });
    if (basket.has(drink.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return res.status(400).json({ error: "Choose a valid quantity for each drink." });
    }
    basket.set(drink.id, { ...drink, quantity: item.quantity });
  }
  const selected = [...basket.values()];
  const single = selected.length === 1 && selected[0].quantity === 1;
  const drinkName = single ? selected[0].name : selected.map(({ name, quantity }) => `${quantity} × ${name}`).join(", ");
  const amount = selected.reduce((total, drink) => total + drink.priceCents * drink.quantity, 0);
  if (amount !== amountCents) return res.status(409).json({ error: "The price changed. Refresh the menu and choose again." });
  const returnUrl = new URL("/order", process.env.ORDER_SITE_URL);
  returnUrl.searchParams.set("checkout", id);

  const { payment_link: link } = await square("online-checkout/payment-links", {
    idempotency_key: id,
    ...(single ? { quick_pay: {
      name: drinkName,
      location_id: process.env.SQUARE_LOCATION_ID,
      price_money: { amount, currency: "USD" },
    } } : { order: {
      location_id: process.env.SQUARE_LOCATION_ID,
      line_items: selected.map((drink) => ({
        name: drink.name,
        quantity: String(drink.quantity),
        base_price_money: { amount: drink.priceCents, currency: "USD" },
      })),
    } }),
    checkout_options: { redirect_url: returnUrl.href },
  });
  if (!link?.url || !link.order_id) throw new Error("Square did not create a checkout link");

  const { error } = await db.from("drink_checkouts").upsert({
    id, square_order_id: link.order_id, name: name.trim(), phone,
    drink: drinkName, handoff, amount_cents: amount,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  return res.status(200).json({ url: link.url });
}

async function checkoutStatus(db, id, res) {
  if (typeof id !== "string" || !uuid.test(id)) return res.status(400).json({ error: "Invalid checkout." });
  const { data: checkout, error } = await db.from("drink_checkouts").select("square_order_id,amount_cents").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!checkout) return res.status(404).json({ error: "Checkout could not be found." });

  const findOrder = async () => {
    const result = await db.from("orders").select(orderFields).eq("square_order_id", checkout.square_order_id).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  };

  let order = await findOrder();
  if (!order) {
    // Reconcile on return even if the payment notification is delayed.
    const result = await square(`orders/${encodeURIComponent(checkout.square_order_id)}`);
    for (const tender of result.order?.tenders ?? []) {
      if (!tender.payment_id) continue;
      const { payment } = await square(`payments/${encodeURIComponent(tender.payment_id)}`);
      await releaseIfPaid(db, checkout, payment);
    }
    order = await findOrder();
  }
  return res.status(order ? 200 : 202).json({ order });
}

async function paymentNotification(db, body, res) {
  const reported = body.data?.object?.payment;
  if (typeof reported?.id === "string" && squareId.test(reported.id) &&
      typeof reported.note === "string" && reported.note.startsWith(walkupNotePrefix)) {
    const { payment } = await square(`payments/${encodeURIComponent(reported.id)}`);
    await releaseWalkupPayment(db, payment);
    return res.status(204).end();
  }
  if (typeof reported?.id !== "string" || !squareId.test(reported.id) ||
      typeof reported.order_id !== "string" || !squareId.test(reported.order_id)) return res.status(204).end();
  const { data: checkout, error } = await db.from("drink_checkouts").select("square_order_id,amount_cents")
    .eq("square_order_id", reported.order_id).maybeSingle();
  if (error) throw error;
  if (checkout) {
    // The notification is a lookup hint. Only Square's authenticated API response can release a ticket.
    const { payment } = await square(`payments/${encodeURIComponent(reported.id)}`);
    await releaseIfPaid(db, checkout, payment);
  }
  return res.status(204).end();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).end();
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SQUARE_ACCESS_TOKEN ||
        !process.env.SQUARE_LOCATION_ID || !process.env.ORDER_SITE_URL) {
      return res.status(503).json({ error: "Online checkout is temporarily unavailable." });
    }
    const db = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (req.method === "GET") return await checkoutStatus(db, req.query.checkout, res);
    if (req.body?.type === "payment.created" || req.body?.type === "payment.updated") {
      return await paymentNotification(db, req.body, res);
    }
    return await startCheckout(db, req, res);
  } catch (error) {
    console.error("Drink checkout failed", error.code || error.message);
    return res.status(502).json({ error: "We couldn't reach checkout. Please try again." });
  }
}
