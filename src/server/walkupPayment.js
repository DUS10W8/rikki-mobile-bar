const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const walkupNotePrefix = "Rikkis walk-up ";
export const isWalkupId = (value) => typeof value === "string" && uuid.test(value);

export async function releaseWalkupPayment(db, payment) {
  if (typeof payment?.note !== "string" || !payment.note.startsWith(walkupNotePrefix)) return false;
  const id = payment.note.slice(walkupNotePrefix.length);
  if (!isWalkupId(id) || payment.status !== "COMPLETED" || payment.source_type !== "CARD" ||
      payment.location_id !== process.env.SQUARE_LOCATION_ID || payment.amount_money?.currency !== "USD" ||
      !Number.isInteger(payment.amount_money.amount) || (payment.refunded_money?.amount ?? 0) > 0) return false;

  const { data, error } = await db.rpc("release_paid_walkup", {
    p_id: id,
    p_payment_id: payment.id,
    p_amount_cents: payment.amount_money.amount,
  });
  if (error) throw error;
  return data === true;
}
