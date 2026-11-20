import { squareRequest } from "./square.js";

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const walkupNotePrefix = "Rikkis walk-up ";
export const isWalkupId = (value) => typeof value === "string" && uuid.test(value);

// `why` (optional array) collects the reason a payment was not accepted, for staff-facing errors and logs.
export async function releaseWalkupPayment(db, payment, why = []) {
  const no = (reason) => { why.push(reason); return false; };
  if (typeof payment?.note !== "string" || !payment.note.startsWith(walkupNotePrefix)) return no("payment note is not a walk-up note");
  const id = payment.note.slice(walkupNotePrefix.length);
  if (!isWalkupId(id)) return no("payment note has no order id");
  if (payment.status !== "COMPLETED") return no(`payment status ${payment.status}`);
  if (payment.source_type !== "CARD") return no(`payment source ${payment.source_type}`);
  if (payment.location_id !== process.env.SQUARE_LOCATION_ID) return no(`payment location ${payment.location_id} is not the configured location`);
  if (payment.amount_money?.currency !== "USD" || !Number.isInteger(payment.amount_money.amount)) return no("payment amount is not USD");
  if ((payment.refunded_money?.amount ?? 0) > 0) return no("payment was refunded");

  const { data: checkout, error: lookupError } = await db.from("walkup_checkouts")
    .select("amount_cents").eq("id", id).maybeSingle();
  if (lookupError) throw lookupError;
  if (!checkout) return no("no walk-up order for this note");

  const amount = payment.amount_money.amount;
  if (amount !== checkout.amount_cents) {
    if (amount < checkout.amount_cents) return no(`paid $${(amount / 100).toFixed(2)}, less than subtotal $${(checkout.amount_cents / 100).toFixed(2)}`);
    if (typeof payment.order_id !== "string" || !payment.order_id) return no(`paid $${(amount / 100).toFixed(2)} vs subtotal $${(checkout.amount_cents / 100).toFixed(2)} and Square has no order to explain the difference`);
    const { order } = await squareRequest("orders/" + encodeURIComponent(payment.order_id));
    const tax = order?.total_tax_money;
    const orderTip = order?.total_tip_money;
    const paymentTip = payment.tip_money;
    const includesMatchingTip = orderTip?.currency === "USD" && paymentTip?.currency === "USD" &&
      Number.isInteger(orderTip.amount) && orderTip.amount > 0 && orderTip.amount === paymentTip.amount &&
      order?.total_money?.amount === amount + orderTip.amount;
    if (order?.id !== payment.order_id || order.location_id !== payment.location_id ||
        order.total_money?.currency !== "USD" || (order.total_money.amount !== amount && !includesMatchingTip) ||
        tax?.currency !== "USD" || tax.amount !== amount - checkout.amount_cents) {
      return no(`paid $${(amount / 100).toFixed(2)} vs subtotal $${(checkout.amount_cents / 100).toFixed(2)}; Square order total ${order?.total_money?.amount}, tax ${tax?.amount}, tip ${orderTip?.amount ?? 0}`);
    }
  }

  const { data, error } = await db.rpc("release_paid_walkup", {
    p_id: id,
    p_payment_id: payment.id,
    p_amount_cents: checkout.amount_cents,
  });
  if (error) throw error;
  return data === true || no("database refused the release (order not waiting for card, or amount changed)");
}

// Square POS does not keep the note we send, so a card payment often arrives without it.
// A note-less payment may still be matched to this order when it is new (made after the
// order was rung, within 30 minutes) and not already used: not by another walk-up order,
// not by a guest QR checkout. releaseWalkupPayment then checks status, location and amount.
export async function unclaimedReason(db, payment, checkout, id) {
  const madeAt = new Date(payment.created_at).getTime();
  const rungAt = new Date(checkout.created_at).getTime();
  if (!Number.isFinite(madeAt) || madeAt < rungAt - 2 * 60000 || madeAt > rungAt + 30 * 60000) {
    return "payment was not made within 30 minutes of this order";
  }
  const { data: used, error } = await db.from("walkup_checkouts").select("id").eq("payment_id", payment.id).neq("id", id).limit(1);
  if (error) throw error;
  if (used?.length) return "payment already used by another walk-up order";
  if (payment.order_id) {
    const { data: qr, error: qrError } = await db.from("drink_checkouts").select("id").eq("square_order_id", payment.order_id).limit(1);
    if (qrError) throw qrError;
    if (qr?.length) return "payment belongs to a guest QR order";
  }
  return null;
}

// Square's payment notification for a note-less Square POS payment: release the one
// card-waiting walk-up order it fits, with no staff step. Ambiguous cases are left to the
// phone, which knows the exact transaction.
export async function releaseNotelessWalkup(db, payment, why = []) {
  if (!payment || payment.note) return false;
  if (payment.status !== "COMPLETED" || payment.source_type !== "CARD" || payment.location_id !== process.env.SQUARE_LOCATION_ID) return false;
  const madeAt = new Date(payment.created_at).getTime();
  if (!Number.isFinite(madeAt)) return false;
  const { data: waiting, error } = await db.from("walkup_checkouts")
    .select("id,created_at,amount_cents,tax_cents").eq("status", "opened").is("archived_at", null)
    .gte("created_at", new Date(madeAt - 30 * 60000).toISOString()).lte("created_at", new Date(madeAt + 2 * 60000).toISOString());
  if (error) throw error;
  const amount = payment.amount_money?.amount;
  const fits = (waiting ?? []).filter((row) => amount === row.amount_cents ||
    (row.tax_cents !== null && Math.abs(amount - row.amount_cents - row.tax_cents) <= 1));
  if (fits.length !== 1) { why.push(fits.length ? `${fits.length} waiting orders fit this payment` : "no waiting order fits this payment"); return false; }
  const reason = await unclaimedReason(db, payment, fits[0], fits[0].id);
  if (reason) { why.push(reason); return false; }
  return releaseWalkupPayment(db, { ...payment, note: walkupNotePrefix + fits[0].id }, why);
}
