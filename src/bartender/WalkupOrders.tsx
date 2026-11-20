import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVE_EVENT, EVENT_DRINK_MENU, EVENT_MENUS, sortCategories } from "../order/eventMenu";
import { CashPanel, ChangeDue, DrawerPanel, type CashResult, type CashSale, type Shift } from "./cash";
import { money, parseCents } from "./cashMoney";
import { shortOrderId } from "../order/orderHandoff";

type Walkup = {
  id: string;
  name: string;
  drink: string;
  amount_cents: number;
  tax_cents: number | null;
  status: "waiting" | "opened" | "paid";
  tender?: "card" | "cash" | null;
  change_cents?: number | null;
  order_id?: string | null;
  pos_url?: string;
  items?: { id: string; name: string; quantity: number; price_cents: number }[] | null;
};

type PosReturn = { state?: string; transaction_id?: string; error_code?: string; status?: string };
const apiPath = "/api/walkup-checkout";
const storageKey = "rikki-walkup-staff";
const pendingLinkKey = "rikki-walkup-square-link";
const launchedKey = "rikki-walkup-launched";   // card attempts this iPhone already sent to Square POS

function readLaunched(): Record<string, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(launchedKey) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}
const pendingCashKey = "rikki-walkup-cash-pending";   // survives reload: the sale being paid in cash
const operatorKey = "rikki-walkup-operator";
const managerKey = "rikki-walkup-manager";

function readPendingCash(): CashSale | null {
  try {
    const saved = JSON.parse(localStorage.getItem(pendingCashKey) || "null");
    return typeof saved?.id === "string" && Number.isInteger(saved.totalCents) ? saved : null;
  } catch {
    return null;
  }
}
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
  const [operator, setOperatorState] = useState(() => localStorage.getItem(operatorKey) || "");
  const [managerCode, setManagerCodeState] = useState(() => sessionStorage.getItem(managerKey) || "");
  const [shift, setShift] = useState<Shift | null>(null);
  const [lastClosed, setLastClosed] = useState<Shift | null>(null);
  const [cashSale, setCashSaleState] = useState<CashSale | null>(readPendingCash);
  const [cashResult, setCashResult] = useState<CashResult | null>(null);
  const setOperator = (value: string) => { setOperatorState(value); localStorage.setItem(operatorKey, value); };
  const setManagerCode = (value: string) => { setManagerCodeState(value); sessionStorage.setItem(managerKey, value); };
  const setCashSale = (sale: CashSale | null) => {
    setCashSaleState(sale);
    if (sale) localStorage.setItem(pendingCashKey, JSON.stringify(sale));
    else localStorage.removeItem(pendingCashKey);
  };
  const [eventMenu, setEventMenu] = useState(ACTIVE_EVENT.menu);
  const menu = EVENT_MENUS[eventMenu] ?? EVENT_DRINK_MENU;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(search.trim());
  const categories = sortCategories([...new Set(menu.map(item => item.category))]);
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
  const [launched, setLaunched] = useState(readLaunched);
  const markLaunched = (id: string) => {
    // Keep a day of history so a reload never offers the same charge twice.
    const next = Object.fromEntries(Object.entries({ ...readLaunched(), [id]: Date.now() })
      .filter(([, at]) => Date.now() - at < 86400000));
    localStorage.setItem(launchedKey, JSON.stringify(next));
    setLaunched(next);
  };
  const unmarkLaunched = (id: string) => {
    const next = { ...readLaunched() };
    delete next[id];
    localStorage.setItem(launchedKey, JSON.stringify(next));
    setLaunched(next);
  };
  const [thanks, setThanks] = useState<string | null>(null);
  const [showStaff, setShowStaff] = useState(false);

  const request = useCallback(async (body?: object, signal?: AbortSignal) => {
    const headers: Record<string, string> = { "Content-Type": "application/json", "X-Walkup-Code": code, "X-Walkup-Request": "1" };
    if (managerCode) headers["X-Manager-Code"] = managerCode;
    const response = await fetch(body || phone ? apiPath : apiPath + "?drawer=1", {
      method: body ? "POST" : "GET",
      signal,
      headers,
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
  }, [code, managerCode, phone]);

  useEffect(() => {
    const controller = new AbortController();
    const update = async () => {
      try {
        const data = await request(undefined, controller.signal);
        if (!controller.signal.aborted) {
          setOrders(data.orders);
          setUnlocked(!data.locked);
          if (!phone) {
            setShift(data.shift ?? null);
            setLastClosed(data.lastClosed ?? null);
          }
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
    const timer = window.setInterval(update, phone ? 2000 : 3000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [code, request, phone]);

  const refresh = async () => {
    try {
      const data = await request();
      setOrders(data.orders);
      if (!phone) {
        setShift(data.shift ?? null);
        setLastClosed(data.lastClosed ?? null);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const startCash = (order: { id: string; amount_cents: number; tax_cents: number | null; drink: string }) => {
    if (order.tax_cents === null || order.tax_cents === undefined) {
      setError("Tax could not be calculated when this order was rung. Cancel it and ring it again, or take card.");
      return;
    }
    setCashResult(null);
    setCashSale({ id: order.id, subtotalCents: order.amount_cents, taxCents: order.tax_cents,
      totalCents: order.amount_cents + order.tax_cents, label: order.drink });
  };

  const takeCash = () => {
    if (!total || busy) return;
    if (!operator.trim()) { setError("Enter your name in the Cash drawer section first."); return; }
    requestId.current ??= crypto.randomUUID();
    void act({ action: "create", id: requestId.current, eventMenu, name, items }, (data) => {
      requestId.current = null;
      setSearch(""); setName("");
      setQuantities({});
      const created = (data as { order?: Walkup }).order;
      if (created) startCash(created);
    });
  };

  const refundCash = (order: Walkup) => {
    if (!shift) { setError("Open the cash drawer to refund cash."); return; }
    const entered = window.prompt(`Refund how much cash for ${order.drink}? Paid ${money(order.amount_cents + (order.tax_cents ?? 0))}.`);
    const amountCents = entered ? parseCents(entered) : null;
    if (!amountCents) return;
    const reason = window.prompt("Reason for the refund (what happened to the item?)")?.trim();
    if (!reason) return;
    void act({ action: "cash_refund", id: order.id, refundId: crypto.randomUUID(), shiftId: shift.shift_id,
      amountCents, reason, operator }, () => setError(`Refunded ${money(amountCents)} cash. If the item came back sealed, log it as returned stock.`));
  };

  const items = menu.filter((drink) => quantities[drink.id])
    .map((drink) => ({ id: drink.id, quantity: quantities[drink.id], priceCents: drink.priceCents }));
  const total = items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0);

  const act = async (body: object, onSuccess?: (data: { url?: string; order?: Walkup }) => void | Promise<void>) => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await request(body);
      await onSuccess?.(data);
      const updated = await request();
      setOrders(updated.orders);
      if (!phone) {
        setShift(updated.shift ?? null);
        setLastClosed(updated.lastClosed ?? null);
      }
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
        setThanks(id);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [unlocked, phone, posReturn, request]);

  // Guest backed out in Square without paying: offer the same Pay screen again.
  useEffect(() => {
    if (!phone || posReturn?.error_code !== "payment_canceled" || !posReturn.state) return;
    unmarkLaunched(posReturn.state);
    window.history.replaceState(null, "", "/bartender?walkup=phone");
    setPosReturn(null);
  }, [phone, posReturn]);

  useEffect(() => {
    if (!thanks) return;
    const timer = window.setTimeout(() => setThanks(null), 8000);
    return () => window.clearTimeout(timer);
  }, [thanks]);

  // Keep the bar iPhone awake on this screen so new charges appear without anyone touching it.
  useEffect(() => {
    if (!phone || !unlocked) return;
    type Lock = { release: () => Promise<void> };
    const wake = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<Lock> } }).wakeLock;
    if (!wake) return;
    let lock: Lock | null = null;
    let active = true;
    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      wake.request("screen").then((next) => {
        if (active) lock = next; else void next.release();
      }).catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release().catch(() => {});
    };
  }, [phone, unlocked]);

  // Oldest card order the iPad sent that this iPhone has not opened in Square yet.
  const pending = phone && unlocked && !posReturn
    ? orders.filter((order) => order.status === "opened" && order.pos_url && !launched[order.id]) : [];
  const charge = pending[pending.length - 1];

  return (
    <section className="rounded-2xl border border-brand-chrome bg-[#fffaf2] p-4 text-brand-ink">
      {phone && unlocked && !showStaff && (
        <GuestScreen charge={charge} waiting={pending.length - 1} onPay={markLaunched}
          confirming={!!posReturn?.state && !posReturn.error_code}
          failed={!!posReturn && (posReturn.status === "error" || !!posReturn.error_code)}
          paid={thanks ? orders.find((order) => order.id === thanks) ?? { id: thanks } : null}
          onStaff={() => setShowStaff(true)} />
      )}
      {phone && unlocked && showStaff && (
        <button type="button" className={`${button} mb-2`} onClick={() => setShowStaff(false)}>Back to guest screen</button>
      )}
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
          {unlocked && !phone && cashResult && (
            <div className="mb-4"><ChangeDue result={cashResult} onNext={() => { setCashResult(null); setCashSale(null); }} /></div>
          )}
          {unlocked && !phone && cashSale && !cashResult && (
            <div className="mb-4">
              <CashPanel sale={cashSale} shift={shift} operator={operator} request={request}
                onDone={(result) => { setCashResult(result); void refresh(); }}
                onCancel={() => setCashSale(null)} />
            </div>
          )}
          {unlocked && !phone && !cashSale && !cashResult && (
            <form className="mb-4 grid gap-3" onSubmit={(event) => {
              event.preventDefault();
              requestId.current ??= crypto.randomUUID();
              void act({ action: "create", id: requestId.current, eventMenu, name, items }, async (data) => {
                requestId.current = null;
                setSearch(""); setName("");
                setQuantities({});
                // Card was chosen: open the attempt now, so the iPhone shows the Charge screen without a tap.
                const created = data.order;
                if (created?.status === "waiting") {
                  await request({ action: "open", id: created.id }).catch(() => {
                    setError("Sent to the list, but the iPhone needs a tap on Prepare payment for this one.");
                  });
                }
              });
            }}>
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
              <input className={input} aria-label="Guest name" disabled={busy} placeholder="Guest name (optional)" value={name} maxLength={80} onChange={(event) => {
                requestId.current = null;
                setName(event.target.value);
              }} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="min-h-14 rounded-2xl bg-emerald-800 px-3 text-lg font-black text-white disabled:opacity-40" disabled={!total || busy} onClick={takeCash}>
                  Take cash · {price(total)}+tax
                </button>
                <button className="min-h-14 rounded-2xl bg-brand-ink px-3 text-lg font-black text-white disabled:opacity-40" disabled={!total || busy}>
                  Card on iPhone · {price(total)}+tax
                </button>
              </div>
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
                <p className="font-black">{order.order_id && <span className="mr-2 rounded bg-brand-ink px-1.5 text-white">#{shortOrderId(order.order_id)}</span>}{order.name} · {price(order.amount_cents)} subtotal</p>
                <p className="text-sm">{order.drink}</p>
                <p className="my-1 text-sm font-bold">{order.status === "paid" ? (order.tender === "cash" ? `Paid cash · change ${money(order.change_cents ?? 0)} · Sent to bar` : "Paid · Sent to bar") : order.status === "opened" ? (posLink?.id === order.id ? "Ready to open Square POS" : order.pos_url && !launched[order.id] ? (phone ? "Ready to charge" : "On the iPhone · waiting for card") : "Payment unconfirmed · Check Square POS") : "Waiting for payment"}</p>
                {!phone && order.status === "waiting" && cashSale?.id !== order.id && (
                  <button type="button" className={`${button} mr-2 bg-emerald-800`} disabled={busy || order.tax_cents === null} onClick={() => startCash(order)}>
                    Take cash · {money(order.amount_cents + (order.tax_cents ?? 0))}
                  </button>
                )}
                {!phone && order.status === "opened" && !order.pos_url && <p className="text-xs font-bold text-rose-900">Card attempt open — find or clear it in Square before taking cash.</p>}
                {!phone && order.status === "paid" && order.tender === "cash" && (
                  <button type="button" className="text-sm font-bold underline" disabled={busy} onClick={() => refundCash(order)}>Cash refund</button>
                )}
                {order.status === "waiting" && (phone || cashSale?.id !== order.id) && (
                  <button type="button" className={button} disabled={busy} onClick={() => void act({
                    action: phone ? "open" : "cancel", id: order.id,
                  }, ({ url }) => {
                    if (!phone || !url) return;
                    const link = { id: order.id, url };
                    sessionStorage.setItem(pendingLinkKey, JSON.stringify(link));
                    setPosLink(link);
                  })}>{phone ? "Prepare payment" : "Cancel before payment"}</button>
                )}
                {order.status === "opened" && posLink?.id !== order.id && !(phone && order.pos_url && !launched[order.id]) && (
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="text-sm font-bold underline" disabled={busy} onClick={() => {
                      void act({ action: "reconcile", id: order.id });
                    }}>Find Square payment</button>
                  <button type="button" className="text-sm font-bold underline" disabled={busy} onClick={() => {
                    if (window.confirm(order.pos_url
                      ? "Cancel this card charge? Only do this if the guest has not paid on the iPhone."
                      : "Clear this attempt only after checking that no charge appears in Square Transactions.")) {
                      void act({ action: "archive", id: order.id });
                    }
                  }}>{order.pos_url ? "Cancel card charge" : "Clear failed attempt"}</button>
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
          {!phone && <DrawerPanel shift={shift} lastClosed={lastClosed} operator={operator} setOperator={setOperator}
            managerCode={managerCode} setManagerCode={setManagerCode} request={request} onChanged={() => void refresh()} />}
        </>
      )}
    </section>
  );
}

type GuestScreenProps = {
  charge?: Walkup;
  waiting: number;
  confirming: boolean;
  failed: boolean;
  paid: Partial<Walkup> | null;
  onPay: (id: string) => void;
  onStaff: () => void;
};

// What the guest sees on the bar iPhone: their items, the total and one Pay button. Nothing else.
function GuestScreen({ charge, waiting, confirming, failed, paid, onPay, onStaff }: GuestScreenProps) {
  const shell = "fixed inset-0 z-50 flex flex-col bg-[#F4ECD9] text-brand-ink";
  const brand = <p className="pt-8 text-center font-heading text-3xl font-bold italic">Rikki&rsquo;s Mobile</p>;
  const staff = <button type="button" aria-label="Staff controls" onClick={onStaff}
    className="absolute right-2 top-2 h-10 w-10 rounded-full text-xs text-brand-ink/20">•••</button>;

  if (confirming) {
    return <div className={shell} role="status">{brand}
      <p className="m-auto text-2xl font-black">Confirming your payment…</p>{staff}</div>;
  }
  if (paid) {
    return <div className={shell} role="status">{brand}
      <div className="m-auto px-6 text-center">
        <p className="text-6xl" aria-hidden="true">✓</p>
        <p className="mt-2 text-3xl font-black">Thank you!</p>
        {paid.order_id && <p className="mt-6 text-lg">Your order number<span className="mt-1 block text-5xl font-black tracking-widest">{shortOrderId(paid.order_id)}</span></p>}
        <p className="mt-6 text-lg">We&rsquo;ll call your number when your drink is ready.</p>
      </div>{staff}</div>;
  }
  if (failed) {
    return <div className={shell} role="alert">{brand}
      <div className="m-auto px-6 text-center">
        <p className="text-3xl font-black">Payment didn&rsquo;t go through</p>
        <p className="mt-3 text-lg">Please let the person at the register know.</p>
      </div>{staff}</div>;
  }
  if (!charge?.pos_url) {
    return <div className={shell}>{brand}
      <p className="m-auto px-8 text-center text-2xl font-bold text-brand-ink/60">Your order will appear here.</p>{staff}</div>;
  }

  const lines = charge.items?.length ? charge.items : null;
  const tax = charge.tax_cents;
  return <div className={shell} role="dialog" aria-modal="true" aria-label="Your order">
    {brand}
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-6">
      <h2 className="mt-6 text-xl font-black">Your order</h2>
      <ul className="mt-3 flex-1 divide-y divide-brand-ink/10 overflow-y-auto">
        {lines ? lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4 py-3 text-lg">
            <span>{line.quantity > 1 && <strong>{line.quantity} × </strong>}{line.name}</span>
            <span className="tabular-nums">{price(line.quantity * line.price_cents)}</span>
          </li>
        )) : <li className="py-3 text-lg">{charge.drink}</li>}
      </ul>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1 border-t-2 border-brand-ink pt-3 text-lg tabular-nums">
        <dt>Subtotal</dt><dd className="text-right">{price(charge.amount_cents)}</dd>
        {tax === null || tax === undefined
          ? <><dt>Tax</dt><dd className="text-right">added at payment</dd></>
          : <><dt>Tax</dt><dd className="text-right">{price(tax)}</dd>
            <dt className="text-2xl font-black">Total</dt><dd className="text-right text-2xl font-black">{price(charge.amount_cents + tax)}</dd></>}
      </dl>
      <a href={charge.pos_url} onClick={() => onPay(charge.id)}
        style={{ color: "#fff", textDecoration: "none" }}
        className="mt-6 block rounded-3xl bg-[#2E9B8A] py-6 text-center text-3xl font-black shadow-lg active:scale-[0.98]">
        Pay{tax === null || tax === undefined ? "" : " " + price(charge.amount_cents + tax)}
      </a>
      {waiting > 0 && <p className="mt-3 text-center text-sm text-brand-ink/50">{waiting} more order{waiting > 1 ? "s" : ""} after this one</p>}
    </div>
    {staff}
  </div>;
}
