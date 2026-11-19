import { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_DRINK_MENU } from "../order/eventMenu";
import salsaMenu from "../order/salsaMenu.json";

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
  const [eventMenu, setEventMenu] = useState("hamilton");
  const menu = eventMenu === "salsa" ? salsaMenu : EVENT_DRINK_MENU;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(search.trim());
  const categories = [...new Set(menu.map(item => item.category))];
  if (eventMenu === "salsa") categories.sort((a, b) =>
    ["Signature cocktails", "Beer and seltzer", "Mixed drinks", "Mules", "Food", "Alcohol-free"].indexOf(a) -
    ["Signature cocktails", "Beer and seltzer", "Mixed drinks", "Mules", "Food", "Alcohol-free"].indexOf(b));
  const matches = menu.filter(item => normalize(item.name + " " + item.category).includes(query));
  function changeQuantity(id: string, delta: number) {
    requestId.current = null;
    setQuantities(current => ({ ...current, [id]: Math.max(0, Math.min(10, (current[id] || 0) + delta)) }));
  }
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

  const items = menu.filter((drink) => quantities[drink.id])
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
              void act({ action: "create", id: requestId.current, eventMenu, name, items }, () => {
                requestId.current = null;
                setSearch(""); setName("");
                setQuantities({});
              });
            }}>
              <input className={input} aria-label="Guest name" disabled={busy} placeholder="Guest name (optional)" value={name} maxLength={80} onChange={(event) => {
                requestId.current = null;
                setName(event.target.value);
              }} />
              <label>Event menu <select className={input} value={eventMenu} disabled={busy || total > 0} onChange={event => { setSearch(""); setEventMenu(event.target.value); requestId.current = null; }}>
                <option value="hamilton">Hamilton</option>
                <option value="salsa">Salsa Night</option>
              </select></label>
              <fieldset disabled={busy} className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <div>
                  <label className="grid gap-1">Find an item
                    <input className={input} type="search" value={search} onChange={event => setSearch(event.target.value)} />
                  </label>
                  <div className="mt-3 grid gap-2">
                    {categories.map((category, index) => {
                      const entries = matches.filter(item => item.category === category);
                      if (!entries.length) return null;
                      const open = query.length > 0 || (expanded[category] ?? index === 0);
                      return <section key={category} className="rounded-xl border border-brand-chrome bg-white">
                        <button type="button" aria-expanded={open} disabled={!!query}
                          className="flex min-h-12 w-full items-center justify-between px-4 text-left font-bold"
                          onClick={() => setExpanded(current => ({ ...current, [category]: !open }))}>
                          {category}<span aria-hidden="true">{open ? "▴" : "▾"}</span>
                        </button>
                        {open && <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                          {entries.map(item => <button key={item.id} type="button"
                            className="rounded-lg border border-brand-chrome p-3 text-left disabled:opacity-50"
                            disabled={quantities[item.id] >= 10} onClick={() => changeQuantity(item.id, 1)}>
                            <strong className="block">{item.name}</strong>{price(item.priceCents)}
                            {!!quantities[item.id] && <span className="ml-2 text-sm">{quantities[item.id]} on ticket</span>}
                          </button>)}
                        </div>}
                      </section>;
                    })}
                    {!matches.length && <p role="status">No items match “{search}”.</p>}
                  </div>
                </div>
                <section aria-label="Current ticket" className="self-start rounded-xl border border-brand-chrome p-3 md:sticky md:top-3">
                  <h3 className="font-bold">Current ticket · {price(total)}</h3>
                  {!items.length && <p>Tap an item to add it.</p>}
                  {items.map(line => {
                    const label = menu.find(item => item.id === line.id)!.name;
                    return <div key={line.id} className="border-b py-2">
                      <strong>{label}</strong> · {price(line.quantity * line.priceCents)}
                      <div className="flex items-center gap-3">
                        <button type="button" className={input} aria-label={'Remove one ' + label} onClick={() => changeQuantity(line.id, -1)}>−</button>
                        {line.quantity}
                        <button type="button" className={input} disabled={line.quantity >= 10} aria-label={'Add one ' + label} onClick={() => changeQuantity(line.id, 1)}>+</button>
                      </div>
                    </div>;
                  })}
                </section>
              </fieldset>
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
