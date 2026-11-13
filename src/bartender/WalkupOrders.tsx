import { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_DRINK_MENU } from "../order/eventMenu";

type Walkup = {
  id: string;
  name: string;
  drink: string;
  amount_cents: number;
  status: "waiting" | "opened" | "paid";
};

type PosReturn = { state?: string; transaction_id?: string; error_code?: string; status?: string };
const apiPath = "/api/walkup-checkout";
const storageKey = "rikki-walkup-staff";
const pendingLinkKey = "rikki-walkup-square-link";
const button = "rounded-xl bg-brand-ink px-4 py-2 font-bold text-white disabled:opacity-50";
const input = "rounded-xl border border-brand-chrome bg-white px-3 py-2";

function price(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function posErrorMessage(code?: string) {
  if (code === "user_id_mismatch") return "Square POS is signed in to a different location. Switch to Rikki’s Mobile Bar before retrying.";
  if (code === "user_not_active") return "Square says this location has not activated card processing.";
  if (code === "payment_canceled") return "Square POS canceled this payment.";
  return "Square POS returned without confirming payment.";
}

function readPosReturn(): PosReturn | null {
  try {
    const data = new URLSearchParams(window.location.search).get("data");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export default function WalkupOrders({ phone = false }: { phone?: boolean }) {
  const [code, setCode] = useState(() => sessionStorage.getItem(storageKey) || "");
  const [unlocked, setUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [entry, setEntry] = useState("");
  const [orders, setOrders] = useState<Walkup[]>([]);
  const [name, setName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [posReturn, setPosReturn] = useState(readPosReturn);
  const [posLink, setPosLink] = useState<{ id: string; url: string } | null>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(pendingLinkKey) || "null");
      return typeof saved?.id === "string" && saved.url?.startsWith("square-commerce-v1://payment/create?data=") ? saved : null;
    } catch {
      return null;
    }
  });
  const requestId = useRef<string | null>(null);
  const submitted = useRef(false);

  const request = useCallback(async (body?: object, signal?: AbortSignal) => {
    const response = await fetch(apiPath, {
      method: body ? "POST" : "GET",
      signal,
      headers: { "Content-Type": "application/json", "X-Walkup-Code": code, "X-Walkup-Request": "1" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (response.status === 401 && !signal?.aborted) {
      sessionStorage.removeItem(storageKey);
      setCode("");
      setUnlocked(false);
      setOrders([]);
      if (!code && !body) return { orders: [], locked: true };
      throw new Error("The server did not accept that staff passphrase. Re-enter the Production WALKUP_STAFF_CODE.");
    }
    if (!response.ok) throw new Error(data.error || "Walk-up checkout is unavailable.");
    return data;
  }, [code]);

  useEffect(() => {
    const controller = new AbortController();
    const update = async () => {
      try {
        const data = await request(undefined, controller.signal);
        if (!controller.signal.aborted) {
          setOrders(data.orders);
          setUnlocked(!data.locked);
          if (code && !data.locked) {
            sessionStorage.removeItem(storageKey);
            setCode("");
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) setError((error as Error).message);
      } finally {
        if (!controller.signal.aborted) setCheckingSession(false);
      }
    };
    void update();
    const timer = window.setInterval(update, 3000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [code, request]);

  const items = EVENT_DRINK_MENU.filter((drink) => quantities[drink.id])
    .map((drink) => ({ id: drink.id, quantity: quantities[drink.id], priceCents: drink.priceCents }));
  const total = items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0);

  const act = async (body: object, onSuccess?: (data: { url?: string }) => void) => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await request(body);
      onSuccess?.(data);
      const updated = await request();
      setOrders(updated.orders);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      submitted.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!phone || !unlocked || !posReturn?.state || posReturn.error_code) return;
    const controller = new AbortController();
    const id = posReturn.state;
    const reconcile = () => request({ action: "reconcile", id }, controller.signal);
    const verification = posReturn.transaction_id
      ? request({ action: "verify", id, transactionId: posReturn.transaction_id }, controller.signal)
        .catch((error) => {
          if (controller.signal.aborted) throw error;
          return reconcile();
        })
      : reconcile();
    void verification
      .then(() => {
        if (controller.signal.aborted) return;
        window.history.replaceState(null, "", "/bartender?walkup=phone");
        setPosReturn(null);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [unlocked, phone, posReturn, request]);

  return (
    <section className="rounded-2xl border border-brand-chrome bg-[#fffaf2] p-4 text-brand-ink">
      <h2 className="text-xl font-black">{phone ? "Walk-up payments" : "Walk-up orders"}</h2>
      {!phone && <p className="my-2 text-sm">Open <a className="underline" href="/bartender?walkup=phone">the payment screen</a> in Safari on the bar iPhone and enter the same staff code.</p>}
      {error && <p className="my-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-900" role="alert">{error}</p>}
      {checkingSession ? (
        <p className="my-2 text-sm" role="status">Checking staff access…</p>
      ) : !unlocked ? (
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => {
          event.preventDefault();
          const value = entry.trim();
          if (!value) return;
          setCheckingSession(true);
          setCode(value);
          setEntry("");
        }}>
          <input className={input} aria-label="Walk-up staff code" placeholder="Walk-up staff code" type="password" value={entry} onChange={(event) => setEntry(event.target.value)} required />
          <button className={button}>Unlock</button>
        </form>
      ) : (
        <>
          <button type="button" className="my-2 text-sm underline" onClick={async () => {
            try {
              await request({ action: "lock" });
            } catch (error) {
              setError((error as Error).message);
              return;
            }
            sessionStorage.removeItem(storageKey);
            setCode("");
            setUnlocked(false);
            setOrders([]);
            setError("");
            setPosLink(null);
            sessionStorage.removeItem(pendingLinkKey);
          }}>Lock payment screen</button>
          {unlocked && !phone && (
            <form className="mb-4 grid gap-3" onSubmit={(event) => {
              event.preventDefault();
              requestId.current ??= crypto.randomUUID();
              void act({ action: "create", id: requestId.current, name, items }, () => {
                requestId.current = null;
                setName("");
                setQuantities({});
              });
            }}>
              <input className={input} aria-label="Guest name" placeholder="Guest name (optional)" value={name} maxLength={80} onChange={(event) => {
                requestId.current = null;
                setName(event.target.value);
              }} />
              <div className="max-h-72 overflow-auto rounded-xl border border-brand-chrome">
                {EVENT_DRINK_MENU.map((drink) => (
                  <label key={drink.id} className="flex items-center justify-between gap-3 border-b border-brand-chrome px-3 py-2">
                    <span>{drink.name} · {price(drink.priceCents)}</span>
                    <select className={input} value={quantities[drink.id] || 0} onChange={(event) => {
                      requestId.current = null;
                      setQuantities((current) => ({ ...current, [drink.id]: Number(event.target.value) }));
                    }}>
                      {Array.from({ length: 11 }, (_, quantity) => <option key={quantity}>{quantity}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <button className={button} disabled={!total || busy}>Send to iPhone · {price(total)} subtotal</button>
            </form>
          )}
          {phone && posReturn && (posReturn.status === "error" || posReturn.error_code) && (
            <div className="my-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-900" role="alert">
              <p className="font-bold">{posErrorMessage(posReturn.error_code)}</p>
              {typeof posReturn.error_code === "string" && <p>Square error: {posReturn.error_code.slice(0, 80)}</p>}
              <p>Check Square Transactions before starting a new charge.</p>
            </div>
          )}
          {phone && posReturn?.state && posReturn.transaction_id && (
            <button type="button" className={button} disabled={busy} onClick={() => void act({
              action: "verify", id: posReturn.state, transactionId: posReturn.transaction_id,
            }, () => {
              window.history.replaceState(null, "", "/bartender?walkup=phone");
              setPosReturn(null);
            })}>Check payment again</button>
          )}
          <ul className="grid gap-2">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl border border-brand-chrome bg-white p-3">
                <p className="font-black">{order.name} · {price(order.amount_cents)} subtotal</p>
                <p className="text-sm">{order.drink}</p>
                <p className="my-1 text-sm font-bold">{order.status === "paid" ? "Paid · Sent to bar" : order.status === "opened" ? (posLink?.id === order.id ? "Ready to open Square POS" : "Payment unconfirmed · Check Square POS") : "Waiting for payment"}</p>
                {order.status === "waiting" && (
                  <button type="button" className={button} disabled={busy} onClick={() => void act({
                    action: phone ? "open" : "cancel", id: order.id,
                  }, ({ url }) => {
                    if (!phone || !url) return;
                    const link = { id: order.id, url };
                    sessionStorage.setItem(pendingLinkKey, JSON.stringify(link));
                    setPosLink(link);
                  })}>{phone ? "Prepare payment" : "Cancel before payment"}</button>
                )}
                {order.status === "opened" && posLink?.id !== order.id && (
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="text-sm font-bold underline" disabled={busy} onClick={() => {
                      void act({ action: "reconcile", id: order.id });
                    }}>Find Square payment</button>
                  <button type="button" className="text-sm font-bold underline" disabled={busy} onClick={() => {
                    if (window.confirm("Clear this attempt only after checking that no charge appears in Square Transactions.")) {
                      void act({ action: "archive", id: order.id });
                    }
                  }}>Clear failed attempt</button>
                  </div>
                )}
                {phone && order.status === "opened" && posLink?.id === order.id && (
                  <a className={`mt-2 inline-block ${button}`} href={posLink.url} onClick={() => {
                    sessionStorage.removeItem(pendingLinkKey);
                    window.setTimeout(() => setPosLink(null), 0);
                  }}>Open Square POS</a>
                )}
              </li>
            ))}
          </ul>
          {!orders.length && <p className="text-sm text-brand-ink/65">No walk-up orders yet.</p>}
        </>
      )}
    </section>
  );
}
