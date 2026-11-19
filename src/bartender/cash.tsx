import { FormEvent, useState } from "react";
import { DENOMINATIONS, cashShortcuts, money, parseCents } from "./cashMoney";
import { shortOrderId } from "../order/orderHandoff";

export type Shift = {
  shift_id: string;
  event_label: string;
  opened_by: string;
  opening_float_cents: number;
  cash_sales_cents: number;
  cash_refunds_cents: number;
  paid_in_cents: number;
  payouts_cents: number;
  drops_cents: number;
  expected_cents: number;
  counted_cents: number | null;
  over_short_cents: number | null;
};

export type CashSale = { id: string; subtotalCents: number; taxCents: number; totalCents: number; label: string };
export type CashResult = { order_id?: string | null; total_cents: number; received_cents: number; change_cents: number; repeat?: boolean };

type Request = (body: object) => Promise<Record<string, unknown>>;
const big = "min-h-14 w-full rounded-2xl px-4 text-lg font-black disabled:opacity-40";
const field = "min-h-12 w-full min-w-0 rounded-xl border border-brand-chrome bg-white px-3 text-lg";

// ── Take cash for one rung order ──────────────────────────────────────────────
export function CashPanel({ sale, shift, operator, request, onDone, onCancel }: {
  sale: CashSale; shift: Shift | null; operator: string; request: Request;
  onDone: (result: CashResult) => void; onCancel: () => void;
}) {
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const received = parseCents(entry);
  const short = received !== null && received < sale.totalCents;
  const change = received !== null && !short ? received - sale.totalCents : null;

  const confirm = async () => {
    if (!shift || received === null || short || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await request({ action: "pay_cash", id: sale.id, shiftId: shift.shift_id,
        totalCents: sale.totalCents, receivedCents: received, operator });
      setUncertain(false);
      onDone(data.result as CashResult);
    } catch (caught) {
      const message = (caught as Error).message;
      // A network failure leaves the outcome unknown: never ask the guest to pay again.
      if (caught instanceof TypeError || /network|fetch|load failed/i.test(message)) setUncertain(true);
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await request({ action: "cash_status", id: sale.id });
      const order = data.order as { status?: string; tender?: string; cash_received_cents?: number; change_cents?: number; order_id?: string } | null;
      if (order?.status === "paid" && order.tender === "cash") {
        setUncertain(false);
        onDone({ order_id: order.order_id, total_cents: sale.totalCents, received_cents: order.cash_received_cents ?? 0, change_cents: order.change_cents ?? 0, repeat: true });
      } else {
        setUncertain(false);
        setError("Not recorded yet. The cash you already took counts — tap Confirm cash received again (it will not charge twice).");
      }
    } catch {
      setError("Still offline. Keep the guest's cash separate and check again when the connection returns.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Take cash" className="rounded-2xl border-2 border-brand-ink bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-black">Take cash</h3>
        <span className="text-xs font-bold text-brand-ink/60">Sale {sale.id.slice(0, 6).toUpperCase()}</span>
      </div>
      <p className="text-sm">{sale.label}</p>
      <p className="mt-1 text-sm text-brand-ink/70">Subtotal {money(sale.subtotalCents)} · Tax {money(sale.taxCents)}</p>
      <p className="my-2 text-4xl font-black" aria-live="polite">Due {money(sale.totalCents)}</p>
      {!shift && <p className="rounded-lg bg-rose-50 p-2 text-sm font-bold text-rose-900" role="alert">Open the cash drawer below before taking cash.</p>}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Cash shortcuts">
        {cashShortcuts(sale.totalCents).map((amount) => (
          <button key={amount} type="button" disabled={busy}
            className={`min-h-12 rounded-xl border px-2 font-black ${received === amount ? "border-brand-ink bg-brand-ink text-white" : "border-brand-chrome"}`}
            onClick={() => setEntry((amount / 100).toFixed(2))}>
            {amount === sale.totalCents ? "Exact" : money(amount)}
          </button>
        ))}
      </div>
      <label className="mt-3 grid gap-1 font-bold">Cash received
        <input className={field} inputMode="decimal" autoComplete="off" value={entry} disabled={busy}
          onChange={(event) => setEntry(event.target.value)} placeholder="0.00" />
      </label>
      {short && <p className="mt-2 font-black text-rose-800" role="alert">Short {money(sale.totalCents - (received ?? 0))} — collect more before confirming.</p>}
      {change !== null && <p className="mt-2 text-2xl font-black">Change {money(change)}</p>}
      {uncertain ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-950" role="alert">
          <p className="font-black">Connection dropped — do not collect again.</p>
          <p className="text-sm">Sale {sale.id.slice(0, 6).toUpperCase()}. Check whether it went through.</p>
          <button type="button" className={`${big} mt-2 bg-amber-900 text-white`} disabled={busy} onClick={() => void check()}>Check this sale</button>
        </div>
      ) : (
        <button type="button" className={`${big} mt-3 bg-brand-ink text-white`} disabled={!shift || received === null || short || busy}
          onClick={() => void confirm()}>
          {busy ? "Saving…" : received !== null && !short ? `Confirm cash received · ${money(received)}` : "Confirm cash received"}
        </button>
      )}
      {error && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-900" role="alert">{error}</p>}
      {!busy && !uncertain && <button type="button" className="mt-3 text-sm font-bold underline" onClick={onCancel}>Back (order stays waiting)</button>}
    </section>
  );
}

export function ChangeDue({ result, onNext }: { result: CashResult; onNext: () => void }) {
  return (
    <section aria-label="Change due" className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-4 text-emerald-950">
      <p className="text-sm font-bold">Paid in cash · ticket sent to the bar{result.repeat ? " (already recorded)" : ""}</p>
      <p className="my-2 text-5xl font-black" aria-live="assertive">Give {money(result.change_cents)}</p>
      <p className="text-sm">Received {money(result.received_cents)} · Due {money(result.total_cents)}</p>
      {result.order_id && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-emerald-950">
          <span className="block text-sm font-bold">Tell the guest and write on the cup:</span>
          <span className="text-4xl font-black tracking-wider">#{shortOrderId(result.order_id)}</span>
          <span className="block text-sm">Pick up at the door table when the code shows Ready.</span>
        </p>
      )}
      <button type="button" className={`${big} mt-3 bg-emerald-800 text-white`} onClick={onNext}>Start next order</button>
    </section>
  );
}

// ── Drawer: open, movements, close ────────────────────────────────────────────
export function DrawerPanel({ shift, lastClosed, operator, setOperator, managerCode, setManagerCode, request, onChanged }: {
  shift: Shift | null; lastClosed: Shift | null; operator: string; setOperator: (value: string) => void;
  managerCode: string; setManagerCode: (value: string) => void; request: Request; onChanged: () => void;
}) {
  const [floatEntry, setFloatEntry] = useState("100.00");
  const [eventLabel, setEventLabel] = useState("Salsa Night");
  const [kind, setKind] = useState("drop");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [closeReason, setCloseReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const counted = DENOMINATIONS.reduce((sum, [value]) => sum + Number(value) * (Number(counts[value]) || 0), 0);

  const run = async (body: object, done: string) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await request({ id: crypto.randomUUID(), operator, ...body });
      const result = data.result as { variance_cents?: number; counted_cents?: number; expected_cents?: number } | undefined;
      setMessage(result?.variance_cents !== undefined
        ? `Closed. Counted ${money(result.counted_cents ?? 0)} · Expected ${money(result.expected_cents ?? 0)} · ${result.variance_cents === 0 ? "Even" : result.variance_cents > 0 ? "Over " + money(result.variance_cents) : "Short " + money(-result.variance_cents)}`
        : done);
      onChanged();
      return true;
    } catch (error) {
      setMessage((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = (event: FormEvent) => {
    event.preventDefault();
    const floatCents = parseCents(floatEntry);
    if (floatCents === null) return setMessage("Enter the opening float.");
    void run({ action: "open_shift", eventLabel, floatCents }, "Drawer open.");
  };
  const move = (event: FormEvent) => {
    event.preventDefault();
    const amountCents = parseCents(amount);
    if (!shift || !amountCents) return setMessage("Enter an amount.");
    void run({ action: "drawer_movement", shiftId: shift.shift_id, kind, amountCents, reason }, "Recorded.").then((ok) => {
      if (ok) { setAmount(""); setReason(""); }
    });
  };
  const close = (event: FormEvent) => {
    event.preventDefault();
    if (!shift && !lastClosed) return;
    const denominations = Object.fromEntries(DENOMINATIONS.map(([value]) => [value, Number(counts[value]) || 0]));
    const target = shift ?? lastClosed!;
    void run({ action: "close_shift", shiftId: target.shift_id, denominations, reason: closeReason }, "Closed.");
  };

  return (
    <details className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-brand-chrome bg-white p-3" open={!shift}>
      <summary className="cursor-pointer text-lg font-black">
        Cash drawer · {shift ? `expected ${money(shift.expected_cents)}` : "closed"}
      </summary>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1 text-sm font-bold">Your name (operator)
          <input className={field} value={operator} maxLength={60} onChange={(event) => setOperator(event.target.value)} />
        </label>
        {!shift ? (
          <form className="grid gap-2" onSubmit={open}>
            <label className="grid gap-1 text-sm font-bold">Event<input className={field} value={eventLabel} onChange={(event) => setEventLabel(event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">Opening float<input className={field} inputMode="decimal" value={floatEntry} onChange={(event) => setFloatEntry(event.target.value)} /></label>
            <button className={`${big} bg-brand-ink text-white`} disabled={busy || !operator.trim()}>Open drawer</button>
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-3 text-sm">
              <dt>Opening float</dt><dd className="text-right">{money(shift.opening_float_cents)}</dd>
              <dt>Cash sales</dt><dd className="text-right">{money(shift.cash_sales_cents)}</dd>
              <dt>Cash refunds</dt><dd className="text-right">{money(shift.cash_refunds_cents)}</dd>
              <dt>Paid in</dt><dd className="text-right">{money(shift.paid_in_cents)}</dd>
              <dt>Payouts</dt><dd className="text-right">{money(shift.payouts_cents)}</dd>
              <dt>Drops to safe</dt><dd className="text-right">{money(shift.drops_cents)}</dd>
              <dt className="font-black">Expected in drawer</dt><dd className="text-right font-black">{money(shift.expected_cents)}</dd>
            </dl>
            <label className="grid gap-1 text-sm font-bold">Manager code (refunds, payouts, drops, close)
              <input className={field} type="password" value={managerCode} onChange={(event) => setManagerCode(event.target.value)} autoComplete="off" />
            </label>
            <form className="grid gap-2" onSubmit={move}>
              <div className="grid grid-cols-2 gap-2">
                <select className={field} value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Movement">
                  <option value="drop">Drop to safe</option><option value="payout">Payout</option><option value="paid_in">Paid in</option>
                </select>
                <input className={field} inputMode="decimal" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label="Amount" />
              </div>
              <input className={field} placeholder="Reason (required)" value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Reason" />
              <button className={`${big} border border-brand-ink`} disabled={busy || !reason.trim() || !operator.trim()}>Record</button>
            </form>
          </>
        )}
        {(shift || lastClosed) && (
          <form className="grid gap-2" onSubmit={close}>
            <h4 className="font-black">{shift ? "Close drawer — count by denomination" : "Recount last close"}</h4>
            <div className="grid grid-cols-5 gap-2">
              {DENOMINATIONS.map(([value, label]) => (
                <label key={value} className="grid min-w-0 text-center text-xs font-bold">{label}
                  <input className="min-h-11 w-full min-w-0 rounded-lg border border-brand-chrome text-center text-base" inputMode="numeric"
                    value={counts[value] ?? ""} onChange={(event) => setCounts((current) => ({ ...current, [value]: event.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                </label>
              ))}
            </div>
            <p className="text-sm font-bold">Counted {money(counted)}{shift ? ` · Expected ${money(shift.expected_cents)} · ${counted - shift.expected_cents === 0 ? "Even" : counted > shift.expected_cents ? "Over " + money(counted - shift.expected_cents) : "Short " + money(shift.expected_cents - counted)}` : ""}</p>
            {!shift && <input className={field} placeholder="Reason for recount (required)" value={closeReason} onChange={(event) => setCloseReason(event.target.value)} aria-label="Recount reason" />}
            <button className={`${big} bg-brand-ink text-white`} disabled={busy || !operator.trim() || (!shift && !closeReason.trim())}>
              {shift ? "Close drawer" : "Record recount"}
            </button>
          </form>
        )}
        {lastClosed && !shift && lastClosed.counted_cents !== null && (
          <p className="text-sm">Last close ({lastClosed.event_label}): counted {money(lastClosed.counted_cents)} · expected {money(lastClosed.expected_cents)} · {lastClosed.over_short_cents === 0 ? "even" : (lastClosed.over_short_cents ?? 0) > 0 ? "over " + money(lastClosed.over_short_cents ?? 0) : "short " + money(-(lastClosed.over_short_cents ?? 0))}</p>
        )}
        {message && <p className="rounded-lg bg-brand-chrome/40 p-2 text-sm font-bold" role="status">{message}</p>}
      </div>
    </details>
  );
}
