import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, GlassWater, Loader2, Martini } from "lucide-react";

import { EVENT_DRINK_MENU } from "./eventMenu";
import { orderSupabase, orderSupabaseConfig } from "./orderSupabaseClient";
import "./OrderPage.css";

const BAR_NAME = "Rikki's Mobile Bar";
const BASE = import.meta.env.BASE_URL;
const TIP_URL = "https://www.rikkismobile.com/tip";
const CONNECT_URL = "https://www.rikkismobile.com/connect";
const ORDER_POLL_INTERVAL_MS = 4000;
const ACTIVE_ORDER_STORAGE_KEY = "rikki-active-order";
const ACTIVE_QUEUE_STATUSES = ["new", "in_progress", "New", "In Progress"];
type Drink = (typeof EVENT_DRINK_MENU)[number];

type OrderStatus = "new" | "in_progress" | "ready" | "completed" | "New" | "In Progress" | "Ready" | "Completed";

type Order = {
  id: string;
  name: string;
  square_order_id?: string | null;
  drink: string;
  status: OrderStatus;
  bar_station?: BarStation | null;
  table_number?: number | null;
  created_at?: string;
  updated_at?: string;
};

type BarStation = "white_bar" | "brown_bar";

type OrderConfirmation = Order & {
  estimatedWaitMinutes: number | null;
};

type StoredActiveOrder = Pick<Order, "id" | "name" | "drink" | "status" | "bar_station" | "table_number" | "created_at"> & {
  orderCode: string;
};

type QueuePositionOrder = Pick<Order, "id" | "created_at" | "status">;

export default function OrderPage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableNumber, setTableNumber] = useState<number | null>(() => getTableNumberFromUrl());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [liveUpdateError, setLiveUpdateError] = useState(false);
  const [restoreError, setRestoreError] = useState(false);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState(false);
  const [checkout, setCheckout] = useState(() => new URLSearchParams(window.location.search).get("checkout"));
  const [checkoutAttempt, setCheckoutAttempt] = useState(0);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const checkoutRequest = useRef<{ id: string; details: string } | null>(null);
  const previousStatusRef = useRef<Order["status"] | null>(null);
  const trackingOrderId = confirmation?.id;
  const trackingOrderStatus = confirmation?.status;

  useEffect(() => {
    if (checkout) return;
    const savedOrder = readStoredActiveOrder();
    if (!savedOrder?.id) return;

    let ignore = false;

    const restoreOrder = async () => {
      const { data, error } = await getOrderById(savedOrder.id);
      if (ignore) return;

      if (error || !data) {
        setRestoreError(true);
        return;
      }

      const normalizedStatus = normalizeStatus(data.status);
      if (normalizedStatus === "new" || normalizedStatus === "in_progress" || normalizedStatus === "ready") {
        const { position } = await countOrderQueuePosition(data);
        if (ignore) return;
        setConfirmation(buildStoredConfirmation(data, position));
        persistActiveOrder(data);
        setRestoreError(false);
        return;
      }

      if (normalizedStatus === "completed") {
        setConfirmation(buildStoredConfirmation(data, null));
        persistActiveOrder(data);
        setRestoreError(false);
        return;
      }

      clearStoredActiveOrder();
    };

    restoreOrder();

    return () => {
      ignore = true;
    };
  }, [checkout]);

  useEffect(() => {
    if (!checkout) return;
    const controller = new AbortController();
    let retry: number | undefined;
    let checks = 0;

    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/drink-checkout?checkout=${encodeURIComponent(checkout)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Checkout status unavailable");
        const { order } = await response.json() as { order: Order | null };
        if (controller.signal.aborted) return;
        if (!order) {
          if (++checks < 6) retry = window.setTimeout(checkPayment, ORDER_POLL_INTERVAL_MS);
          else setCheckoutMessage("Payment is taking longer to confirm. Check again here before paying for another drink.");
          return;
        }
        persistActiveOrder(order);
        setConfirmation(buildStoredConfirmation(order, null));
        const url = new URL(window.location.href);
        const orderUrl = new URL(url.pathname, url.origin);
        if (order.table_number) orderUrl.searchParams.set("table", String(order.table_number));
        window.history.replaceState(null, "", orderUrl);
        setCheckout(null);
      } catch {
        if (!controller.signal.aborted) setCheckoutMessage("We couldn't confirm your payment yet. Check again before paying for another drink.");
      }
    };

    void checkPayment();
    return () => {
      controller.abort();
      window.clearTimeout(retry);
    };
  }, [checkout, checkoutAttempt]);

  useEffect(() => {
    if (!trackingOrderId || !trackingOrderStatus) {
      previousStatusRef.current = null;
      setLiveUpdateError(false);
      return undefined;
    }

    previousStatusRef.current = trackingOrderStatus;
    let ignore = false;

    const pollOrder = async () => {
      const { data, error } = await getOrderById(trackingOrderId);
      if (ignore) return;

      if (error || !data) {
        setLiveUpdateError(true);
        return;
      }

      const { position } = await countOrderQueuePosition(data);
      if (ignore) return;

      setLiveUpdateError(false);
      setConfirmation((current) => {
        if (!current) return current;
        const nextConfirmation = { ...current, ...data, estimatedWaitMinutes: position };
        persistActiveOrder(nextConfirmation);
        return nextConfirmation;
      });

      const nextStatus = normalizeStatus(data.status);
      const previousStatus = previousStatusRef.current ? normalizeStatus(previousStatusRef.current) : "";

      if (nextStatus === "ready" && previousStatus !== "ready") {
        if ("vibrate" in navigator) navigator.vibrate?.(180);
        if (soundAlertEnabled) playCustomerChime();
      }

      previousStatusRef.current = data.status;
    };

    const pollId = window.setInterval(pollOrder, ORDER_POLL_INTERVAL_MS);
    return () => {
      ignore = true;
      window.clearInterval(pollId);
    };
  }, [trackingOrderId, trackingOrderStatus, soundAlertEnabled]);

  const groupedDrinks = useMemo(() => {
    return EVENT_DRINK_MENU.reduce<Record<string, Drink[]>>((groups, drink) => {
      const key = drink.category || "House";
      groups[key] = groups[key] || [];
      groups[key].push(drink);
      return groups;
    }, {});
  }, []);

  const canSubmit = Boolean(
    selectedDrink && tableNumber && name.trim().length >= 2 && !submitting,
  );

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !selectedDrink) return;
    setError("");
    setSubmitting(true);
    const details = JSON.stringify({
      drinkId: String(selectedDrink.id),
      name: name.trim(),
      phone: isValidPhone(phone) ? normalizePhone(phone) : "",
      table: tableNumber,
      amountCents: selectedDrink.priceCents,
    });
    if (checkoutRequest.current?.details !== details) {
      checkoutRequest.current = { id: crypto.randomUUID(), details };
    }

    try {
      const response = await fetch("/api/drink-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(details), id: checkoutRequest.current.id }),
      });
      const { url, error } = await response.json();
      if (!response.ok || !url) throw new Error(error || "Checkout is temporarily unavailable.");
      window.location.assign(url);
    } catch (error) {
      setSubmitting(false);
      setError(error instanceof Error ? error.message : "Checkout is temporarily unavailable.");
    }
  };

  const placeAnotherOrder = () => {
    clearStoredActiveOrder();
    checkoutRequest.current = null;
    setConfirmation(null);
    setRestoreError(false);
    setLiveUpdateError(false);
    previousStatusRef.current = null;
  };

  if (checkout) {
    return (
      <OrderShell>
        <main className="mx-auto max-w-md px-5 py-12">
          <section className="rounded-[1.75rem] border border-brand-chrome bg-[#fffaf2] p-6">
            <h1 className="mb-4 text-2xl font-black">Confirming your payment</h1>
            <div aria-live="polite">
              {checkoutMessage ? <p>{checkoutMessage}</p> : <Loading label="Waiting for Square to confirm your payment" />}
            </div>
            {checkoutMessage && (
              <button className="mt-4 rounded-2xl bg-brand-ink px-5 py-3 font-bold text-white" onClick={() => {
                setCheckoutMessage("");
                setCheckoutAttempt((attempt) => attempt + 1);
              }}>Check payment again</button>
            )}
          </section>
        </main>
      </OrderShell>
    );
  }

  if (confirmation) {
    return (
      <OrderShell>
        <section className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
          <div className="flex flex-1 flex-col justify-center">
            <div className="rounded-[1.75rem] border border-brand-chrome bg-[#fffaf2]/90 p-6 text-center shadow-[0_28px_80px_rgba(46,46,46,0.14)] backdrop-blur">
              <CheckCircle2 className="mx-auto h-14 w-14 text-brand-sea" />
              <h1 className="mt-4 text-3xl font-bold text-brand-ink">{confirmation.square_order_id ? "Payment confirmed" : "Your order is in"}</h1>
              <p className="mt-3 text-brand-ink/70">
                {confirmation.name}, your {confirmation.drink} has been sent to the bar.
              </p>
              <div className="mt-5 rounded-2xl bg-brand-ink px-4 py-5 text-white">
                <p className="text-sm uppercase tracking-wide text-white/70">Order</p>
                <p className="mt-1 text-4xl font-black">#{shortOrderId(confirmation.id)}</p>
                {confirmation.table_number && (
                  <p className="mt-2 text-sm font-bold uppercase tracking-wide text-white/80">
                    We'll bring it to Table {confirmation.table_number}
                  </p>
                )}
              </div>
              <p className="mt-4 text-base font-bold text-brand-ink">{getConfirmationStatusMessage(confirmation)}</p>
              <LiveOrderTracker order={confirmation} liveUpdateError={liveUpdateError} />
              <button
                className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-black ${
                  soundAlertEnabled
                    ? "border-brand-sea/30 bg-brand-sea/10 text-brand-sea"
                    : "border-brand-chrome bg-white/55 text-brand-ink"
                }`}
                type="button"
                onClick={() => {
                  setSoundAlertEnabled(true);
                  playCustomerChime();
                }}
              >
                {soundAlertEnabled ? "Sound alert enabled" : "Enable sound alert"}
              </button>
              <p className="mt-4 text-sm font-bold text-brand-sea">Want another drink later? Save this page.</p>
              <div className="mt-6 grid gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink/45">Loved the service?</p>
                <a
                  className="tip-primary-cta"
                  href={TIP_URL}
                >
                  Tip the Bar Team
                </a>
                <a
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-brand-chrome bg-[#fffaf2] px-5 py-3 font-black text-brand-ink shadow-sm"
                  href={CONNECT_URL}
                >
                  Connect With Rikki's
                </a>
              </div>
              <button className="mt-6 w-full rounded-2xl bg-brand-sea px-5 py-4 font-bold text-white shadow-[0_14px_32px_rgba(46,155,138,0.25)]" onClick={placeAnotherOrder}>
                Place another order
              </button>
            </div>
          </div>
        </section>
      </OrderShell>
    );
  }

  return (
    <OrderShell>
      <main className="mx-auto max-w-md px-4 pb-44 pt-5">
        <header className="mb-6 overflow-hidden rounded-[1.75rem] border border-brand-chrome bg-[#fffaf2]/88 shadow-[0_24px_70px_rgba(46,46,46,0.12)] backdrop-blur">
          <div className="bg-[#fffaf2] px-4 pb-3 pt-4">
            <img
              src={`${BASE}tip/path16.png`}
              alt={BAR_NAME}
              className="mx-auto h-auto w-[67%] rounded-b-3xl object-contain max-[420px]:w-[72%]"
            />
          </div>
          <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-chrome bg-brand-ink text-white shadow-[0_10px_24px_rgba(20,20,20,0.18)]">
              <Martini className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-sea">{BAR_NAME}</p>
              <h1 className="text-3xl font-black text-brand-ink">Atlas Beauty Drink Menu</h1>
              <p className="mt-1 text-sm font-bold text-brand-ink/65">Six Years of Beauty</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-brand-ink/70">Choose a drink, pay securely with Square, and we’ll bring it to your table.</p>
          {tableNumber && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-sea/30 bg-brand-sea/10 px-3 py-1.5 text-sm font-black uppercase tracking-wide text-brand-sea">
              Table {tableNumber}
            </div>
          )}
          </div>
        </header>

        {error && <Alert>{error}</Alert>}
        {restoreError && <RestoreOrderAlert onClear={placeAnotherOrder} />}

        <form onSubmit={submitOrder} className="space-y-5">
          <div className="space-y-3">
            {Object.entries(groupedDrinks).map(([category, items], index) => {
              const isOpen = openCategory === category;
              const panelId = "drink-category-" + index;
              return (
                <section key={category} className="overflow-hidden rounded-2xl border border-brand-chrome bg-[#fffaf2]/92 shadow-sm">
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex min-h-16 w-full scroll-mb-32 scroll-mt-4 items-center gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-sea"
                      onClick={(event) => {
                        setOpenCategory(isOpen ? null : category);
                        if (!isOpen) {
                          const header = event.currentTarget;
                          requestAnimationFrame(() => header.scrollIntoView({ block: "nearest" }));
                        }
                      }}
                    >
                      <span className="flex-1 font-black">{category}</span>
                      <span className="shrink-0 text-sm text-brand-ink/65">{items.length} drinks</span>
                      <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </h2>
                  <div id={panelId} hidden={!isOpen}>
                    <div className="grid gap-2 border-t border-brand-chrome/70 p-3">
                      {items.map((drink) => (
                        <button
                          key={drink.id}
                          type="button"
                          className={`flex min-h-20 items-center justify-between rounded-2xl border bg-[#fffaf2]/92 px-4 py-3 text-left shadow-[0_10px_28px_rgba(46,46,46,0.07)] transition ${
                            selectedDrink?.id === drink.id ? "border-brand-sea ring-2 ring-brand-sea/20" : "border-brand-chrome/80"
                          }`}
                          aria-pressed={selectedDrink?.id === drink.id}
                          onClick={() => {
                            setSelectedDrink(drink);
                          }}
                        >
                          <span className="min-w-0 pr-3">
                            <span className="block text-lg font-bold text-brand-ink">{drink.name}</span>
                            {drink.description && <span className="line-clamp-2 text-sm text-brand-ink/55">{drink.description}</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 font-black">
                            {formatDrinkPrice(drink.priceCents)}
                            {selectedDrink?.id === drink.id ? <Check className="h-6 w-6 shrink-0 text-brand-sea" /> : <GlassWater className="h-5 w-5 shrink-0 text-brand-rust/60" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <section className="rounded-[1.5rem] border border-brand-chrome bg-[#fffaf2]/92 p-4 shadow-[0_14px_36px_rgba(46,46,46,0.08)]">
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-bold text-brand-ink/75">Delivery table</span>
                <select className="order-input" value={tableNumber ?? ""} onChange={(event) => setTableNumber(Number(event.target.value) || null)} required>
                  <option value="">Choose your table</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((table) => (
                    <option key={table} value={table}>Table {table}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-bold text-brand-ink/75">Name</span>
                <input className="order-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Alex" autoComplete="name" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-bold text-brand-ink/75">Phone <span className="font-medium text-brand-ink/45">(optional)</span></span>
                <input
                  className="order-input"
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
            </div>
          </section>

          <div className="order-checkout-bar fixed inset-x-0 bottom-0 z-10 border-t border-brand-chrome bg-[#fffaf2]/92 p-4 shadow-[0_-18px_45px_rgba(46,46,46,0.10)] backdrop-blur">
            <div className="mx-auto max-w-md">
              {selectedDrink && <p className="mb-2 truncate text-sm font-bold text-brand-ink/75">{selectedDrink.name}{tableNumber ? " · Table " + tableNumber : " · Choose a delivery table"}</p>}
              <button disabled={!canSubmit} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-4 text-lg font-black text-white shadow-[0_16px_34px_rgba(20,20,20,0.22)] disabled:cursor-not-allowed disabled:bg-brand-chrome disabled:text-brand-ink/50 disabled:shadow-none">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Martini className="h-5 w-5" />}
                {submitting ? "Opening Square checkout…" : selectedDrink ? `Pay ${formatDrinkPrice(selectedDrink.priceCents)}` : "Choose a drink"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </OrderShell>
  );
}

function OrderShell({ children }: { children: ReactNode }) {
  return <div className="order-page min-h-screen text-brand-ink">{children}</div>;
}

function Alert({ children }: { children: ReactNode }) {
  return <div role="alert" className="my-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{children}</div>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-brand-chrome bg-[#fffaf2]/92 px-4 py-3 text-brand-ink/65">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function RestoreOrderAlert({ onClear }: { onClear: () => void }) {
  return (
    <div className="my-3 rounded-2xl border border-brand-rust/30 bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-brand-rust">
      <p>We couldn't restore your last order. Please check with a staff member.</p>
      <button className="mt-3 rounded-xl bg-brand-rust px-4 py-2 font-black text-white" type="button" onClick={onClear}>
        Place another order
      </button>
    </div>
  );
}

function requireSupabase(operation: string) {
  if (orderSupabase) return null;
  const error = new Error(orderSupabaseConfig.error || "Supabase is not configured.");
  logSupabaseFailure(operation, error);
  return error;
}

function logSupabaseFailure(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[Supabase request failed]", {
    operation,
    status: "network/config",
    message,
  });
}

async function getOrderById(id: string) {
  const configError = requireSupabase("orders.trackerSelect");
  if (configError || !orderSupabase) return { data: null, error: configError };

  try {
    const { data, error } = await orderSupabase
      .from("orders")
      .select("id,name,drink,status,bar_station,table_number,created_at,updated_at,square_order_id")
      .eq("id", id)
      .single<Order>();

    return { data, error };
  } catch (error) {
    logSupabaseFailure("orders.trackerSelect", error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function countOrderQueuePosition(order: Order) {
  const normalizedStatus = normalizeStatus(order.status);
  if (normalizedStatus !== "new" && normalizedStatus !== "in_progress") {
    return { position: null, error: null };
  }

  const configError = requireSupabase("orders.queuePosition");
  if (configError || !orderSupabase) return { position: null, error: configError };

  try {
    const { data, error } = await orderSupabase
      .from("orders")
      .select("id,created_at,status")
      .not("square_order_id", "is", null)
      .in("status", ACTIVE_QUEUE_STATUSES)
      .order("created_at", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });

    if (error) return { position: null, error };

    const activeOrders = ((data || []) as QueuePositionOrder[]).filter((item) => {
      if (!order.created_at || !item.created_at) return true;
      if (item.created_at < order.created_at) return true;
      if (item.created_at === order.created_at) return item.id <= order.id;
      return false;
    });

    const position = activeOrders.findIndex((item) => item.id === order.id);
    return { position: position >= 0 ? position + 1 : Math.max(activeOrders.length, 1), error: null };
  } catch (error) {
    logSupabaseFailure("orders.queuePosition", error);
    return { position: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

function getTableNumberFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("table");
    if (!raw) return null;

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) return null;

    return parsed;
  } catch (error) {
    console.warn("[Table number parse failed]", error);
    return null;
  }
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return `+1${national}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function shortOrderId(id: string) {
  return String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
}

function buildStoredConfirmation(order: Order, estimatedWaitMinutes: number | null): OrderConfirmation {
  return {
    ...order,
    estimatedWaitMinutes,
  };
}

function persistActiveOrder(order: Order) {
  try {
    const activeOrder: StoredActiveOrder = {
      id: order.id,
      orderCode: shortOrderId(order.id),
      name: order.name,
      drink: order.drink,
      created_at: order.created_at,
      status: order.status,
      bar_station: order.bar_station,
      table_number: order.table_number,
    };
    localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(activeOrder));
  } catch (error) {
    console.warn("[Order restore unavailable]", error);
  }
}

function readStoredActiveOrder() {
  try {
    const rawOrder = localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
    if (!rawOrder) return null;

    const parsedOrder = JSON.parse(rawOrder) as Partial<StoredActiveOrder>;
    if (!parsedOrder.id || typeof parsedOrder.id !== "string") return null;

    return parsedOrder;
  } catch (error) {
    console.warn("[Order restore parse failed]", error);
    return null;
  }
}

function clearStoredActiveOrder() {
  try {
    localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
  } catch (error) {
    console.warn("[Order restore clear failed]", error);
  }
}

function formatDrinkPrice(priceCents: number) {
  return (priceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function getConfirmationStatusMessage(order: OrderConfirmation) {
  const normalizedStatus = normalizeStatus(order.status);
  const stationName = getStationLabel(order.bar_station);

  if (normalizedStatus === "in_progress" && stationName) return `Your drink is being made at the ${stationName}.`;
  if (normalizedStatus === "in_progress") return "Your drink is being made now.";
  if (normalizedStatus === "ready" && order.table_number) return `Your drink is ready. We’ll bring it to Table ${order.table_number}.`;
  if (normalizedStatus === "ready" && stationName) return `Your drink is ready at the ${stationName}!`;
  if (normalizedStatus === "ready") return "Your drink is ready for pickup.";
  if (normalizedStatus === "completed") return "Enjoy your drink!";

  const minutes = order.estimatedWaitMinutes;
  if (minutes === null) return "Your drink should be ready soon.";
  return `Your drink should be ready in about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

function LiveOrderTracker({ order, liveUpdateError }: { order: OrderConfirmation; liveUpdateError: boolean }) {
  const normalizedStatus = normalizeStatus(order.status);
  const stationName = getStationLabel(order.bar_station);

  return (
    <section className="mt-5 rounded-2xl border border-brand-chrome/80 bg-white/55 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-brand-ink/45">Live status</p>
      <div className="mt-3 grid gap-2">
        {[
          { id: "received", label: "Order received", active: true },
          { id: "queue", label: "In the queue", active: ["new", "in_progress", "ready", "completed"].includes(normalizedStatus) },
          { id: "making", label: "Being made", active: ["in_progress", "ready", "completed"].includes(normalizedStatus) },
          { id: "ready", label: normalizedStatus === "completed" ? (order.table_number ? "Delivered" : "Picked up") : (order.table_number ? "Ready for delivery" : "Ready for pickup"), active: ["ready", "completed"].includes(normalizedStatus) },
        ].map((step) => (
          <div key={step.id} className={`flex items-center gap-2 text-sm font-bold ${step.active ? "text-brand-ink" : "text-brand-ink/35"}`}>
            <span className={`h-3 w-3 rounded-full ${step.active ? "bg-brand-sea" : "bg-brand-chrome"}`} />
            {step.label}
          </div>
        ))}
      </div>
      <p className="mt-4 text-base font-black text-brand-ink">{getLiveStatusMessage(normalizedStatus, stationName, order.table_number)}</p>
      {liveUpdateError && (
        <p className="mt-3 rounded-xl border border-brand-rust/30 bg-[#fff4eb] px-3 py-2 text-sm font-bold text-brand-rust">
          Live updates are having trouble. Please check with a staff member.
        </p>
      )}
    </section>
  );
}

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/\s+/g, "_");
}

function getStationLabel(station?: BarStation | null) {
  if (station === "white_bar") return "White Bar";
  if (station === "brown_bar") return "Brown Bar";
  return "";
}

function getLiveStatusMessage(status: string, stationName: string, table?: number | null) {
  if (status === "in_progress" && stationName) return `Your drink is being made at the ${stationName}.`;
  if (status === "ready" && table) return `We’ll bring your drink to Table ${table} shortly.`;
  if (status === "ready" && stationName) return `Your drink is ready at the ${stationName}!`;
  if (status === "ready") return "Your drink is ready! Please head to the pickup area.";
  if (status === "completed") return table ? "Your drink has been delivered. Cheers!" : "Your drink has been picked up. Cheers!";
  return "Your drink is in the queue.";
}

function playCustomerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
  } catch (error) {
    console.warn("[Customer sound unavailable]", error);
  }
}
