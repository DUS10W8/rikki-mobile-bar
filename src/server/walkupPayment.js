import { squareRequest } from "./square.js";

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const walkupNotePrefix = "Rikkis walk-up ";
export const isWalkupId = (value) => typeof value === "string" && uuid.test(value);

export async function releaseWalkupPayment(db, payment) {
  if (typeof payment?.note !== "string" || !payment.note.startsWith(walkupNotePrefix)) return false;
  const id = payment.note.slice(walkupNotePrefix.length);
  if (!isWalkupId(id) || payment.status !== "COMPLETED" || payment.source_type !== "CARD" ||
      payment.location_id !== process.env.SQUARE_LOCATION_ID || payment.amount_money?.currency !== "USD" ||
      !Number.isInteger(payment.amount_money.amount) || (payment.refunded_money?.amount ?? 0) > 0) return false;

  const { data: checkout, error: lookupError } = await db.from("walkup_checkouts")
    .select("amount_cents").eq("id", id).maybeSingle();
  if (lookupError) throw lookupError;
  if (!checkout) return false;

  const amount = payment.amount_money.amount;
  if (amount !== checkout.amount_cents) {
    if (amount < checkout.amount_cents || typeof payment.order_id !== "string" || !payment.order_id) return false;
    const { order } = await squareRequest("orders/" + encodeURIComponent(payment.order_id));
    const tax = order?.total_tax_money;
    if (order?.id !== payment.order_id || order.location_id !== payment.location_id ||
        order.total_money?.currency !== "USD" || order.total_money.amount !== amount ||
        tax?.currency !== "USD" || tax.amount !== amount - checkout.amount_cents) return false;
  }

  const { data, error } = await db.rpc("release_paid_walkup", {
    p_id: id,
    p_payment_id: payment.id,
    p_amount_cents: checkout.amount_cents,
  });
  if (error) throw error;
  return data === true;
}
