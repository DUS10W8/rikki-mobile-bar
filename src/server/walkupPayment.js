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
