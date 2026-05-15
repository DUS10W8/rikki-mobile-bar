import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, GlassWater, Loader2, Martini, RefreshCw } from "lucide-react";

import { ENABLE_DRINK_LIMITS } from "./eventConfig";
import { EVENT_DRINK_MENU } from "./eventMenu";
import { orderSupabase, orderSupabaseConfig } from "./orderSupabaseClient";
import "./OrderPage.css";

const BAR_NAME = "Rikki's Mobile Bar";
const BASE = import.meta.env.BASE_URL;
const TIP_URL = "https://www.rikkismobile.com/tip";
const CONNECT_URL = "https://www.rikkismobile.com/connect";
const ORDER_POLL_INTERVAL_MS = 4000;
const MAX_DRINK_TICKETS = 2;
const ACTIVE_ORDER_STORAGE_KEY = "rikki-active-order";
const TICKET_COUNT_STATUSES = ["new", "in_progress", "ready", "completed", "New", "In Progress", "Ready", "Completed"];
const ACTIVE_QUEUE_STATUSES = ["new", "in_progress", "New", "In Progress"];
const PAYMENT_LINKS = {
  beer: "https://square.link/u/i3mPQjF9",
  wine: "https://square.link/u/aqBA7xBE",
  cocktail: "https://square.link/u/X39N1mMJ",
};

type Drink = {
  id: string;
  name: string;
  description?: string | null;
  category: string | null;
  active: boolean;
  is_available?: boolean;
  display_order?: number | null;
};

type OrderStatus = "new" | "in_progress" | "ready" | "completed" | "New" | "In Progress" | "Ready" | "Completed";

type Order = {
  id: string;
  name: string;
  phone: string;
  drink: string;
  status: OrderStatus;
  bar_station?: BarStation | null;
  created_at?: string;
  updated_at?: string;
};

type BarStation = "white_bar" | "brown_bar";

type OrderConfirmation = Order & {
  ticketUsed: number;
  ticketLabel: string;
  confirmationMessage: string;
  estimatedWaitMinutes: number | null;
  payment: DrinkPayment | null;
};

type StoredActiveOrder = Pick<Order, "id" | "name" | "drink" | "status" | "bar_station" | "created_at"> & {
  orderCode: string;
};

type DrinkPayment = {
  kind: "beer" | "wine" | "cocktail";
  price: 3 | 4 | 5;
  link: string;
};

type LoadDrinksOptions = {
  setDrinks: (drinks: Drink[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setUnavailable: (unavailable: boolean) => void;
};

export default function OrderPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuUnavailable, setMenuUnavailable] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [guestOrderCount, setGuestOrderCount] = useState<number | null>(null);
  const [checkingTicketCount, setCheckingTicketCount] = useState(false);
  const [liveUpdateError, setLiveUpdateError] = useState(false);
  const [restoreError, setRestoreError] = useState(false);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState(false);
  const previousStatusRef = useRef<Order["status"] | null>(null);
  const trackingOrderId = confirmation?.id;
  const trackingOrderStatus = confirmation?.status;

  useEffect(() => {
    const loadOptions = { setDrinks, setLoading, setError, setUnavailable: setMenuUnavailable };
    loadDrinks(loadOptions);

    if (!orderSupabase) return undefined;

    const channel = orderSupabase
      .channel("public-drinks")
      .on("postgres_changes", { event: "*", schema: "public", table: "drinks" }, () => {
        loadDrinks(loadOptions);
      })
      .subscribe();

    return () => {
      orderSupabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
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
        const { count } = await countActiveQueuedDrinks();
        if (ignore) return;
        setConfirmation(buildStoredConfirmation(data, count));
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
  }, []);

  useEffect(() => {
    if (!ENABLE_DRINK_LIMITS) {
      setGuestOrderCount(null);
      setCheckingTicketCount(false);
      return undefined;
    }

    if (!isValidPhone(phone)) {
      setGuestOrderCount(null);
      setCheckingTicketCount(false);
      return undefined;
    }

    let ignore = false;
    setCheckingTicketCount(true);

    countGuestOrders(normalizePhone(phone)).then(({ count }) => {
      if (ignore) return;
      setGuestOrderCount(count);
      setCheckingTicketCount(false);
    });

    return () => {
      ignore = true;
    };
  }, [phone]);

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

      setLiveUpdateError(false);
      setConfirmation((current) => {
        if (!current) return current;
        const nextConfirmation = { ...current, ...data };
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
    return drinks.reduce<Record<string, Drink[]>>((groups, drink) => {
      const key = drink.category || "House";
      groups[key] = groups[key] || [];
      groups[key].push(drink);
      return groups;
    }, {});
  }, [drinks]);

  const phoneIsValid = isValidPhone(phone);
  const canSubmit = Boolean(selectedDrink && name.trim().length >= 2 && !submitting);
  const selectedDrinkPayment = ENABLE_DRINK_LIMITS && selectedDrink ? getDrinkPayment(selectedDrink) : null;
  const nextDrinkLabel = ENABLE_DRINK_LIMITS ? getNextDrinkLabel(guestOrderCount, selectedDrinkPayment) : "";
  const isPaidNextDrink = Boolean(ENABLE_DRINK_LIMITS && guestOrderCount !== null && guestOrderCount >= MAX_DRINK_TICKETS && selectedDrinkPayment);
  const submitButtonLabel = isPaidNextDrink && selectedDrinkPayment ? `Order Drink ($${selectedDrinkPayment.price})` : "Order Drink";

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedDrink || name.trim().length < 2) {
      setError("Choose a drink and enter your name.");
      return;
    }

    setSubmitting(true);
    const normalizedPhone = phoneIsValid ? normalizePhone(phone) : phone.trim();
    const { count: existingTicketCount, error: ticketError } = ENABLE_DRINK_LIMITS && normalizedPhone
      ? await countGuestOrders(normalizedPhone)
      : { count: 0, error: null };

    if (ticketError || existingTicketCount === null) {
      setSubmitting(false);
      setError(`Order could not be submitted. ${ticketError?.message || "Could not verify drink tickets."}`);
      return;
    }

    const { data, error: orderError } = await createOrder({
      name: name.trim(),
      phone: normalizedPhone,
      drink: selectedDrink.name,
      status: "new",
    });

    if (orderError || !data) {
      setSubmitting(false);
      setError(`Order could not be submitted. ${orderError?.message || "Please try again."}`);
      return;
    }

    const { count: activeQueueDepth } = await countActiveQueuedDrinks();
    setSubmitting(false);

    setGuestOrderCount(existingTicketCount + 1);
    const nextConfirmation = {
      ...data,
      ticketUsed: existingTicketCount + 1,
      ticketLabel: getSubmittedDrinkLabel(existingTicketCount, selectedDrink),
      confirmationMessage: getConfirmationMessage(existingTicketCount),
      estimatedWaitMinutes: activeQueueDepth,
      payment: ENABLE_DRINK_LIMITS && existingTicketCount >= MAX_DRINK_TICKETS ? getDrinkPayment(selectedDrink) : null,
    };
    setConfirmation(nextConfirmation);
    persistActiveOrder(nextConfirmation);
    setSelectedDrink(null);
    setName("");
    setPhone("");
  };

  const placeAnotherOrder = () => {
    clearStoredActiveOrder();
    setConfirmation(null);
    setRestoreError(false);
    setLiveUpdateError(false);
    previousStatusRef.current = null;
  };

  const reloadDrinks = () => {
    loadDrinks({ setDrinks, setLoading, setError, setUnavailable: setMenuUnavailable });
  };

  if (confirmation) {
    return (
      <OrderShell>
        <section className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
          <div className="flex flex-1 flex-col justify-center">
            <div className="rounded-[1.75rem] border border-brand-chrome bg-[#fffaf2]/90 p-6 text-center shadow-[0_28px_80px_rgba(46,46,46,0.14)] backdrop-blur">
              <CheckCircle2 className="mx-auto h-14 w-14 text-brand-sea" />
              <h1 className="mt-4 text-3xl font-bold text-brand-ink">Your order is in!</h1>
              <p className="mt-3 text-brand-ink/70">
                {confirmation.name}, your {confirmation.drink} is in the queue.
              </p>
              <div className="mt-5 rounded-2xl bg-brand-ink px-4 py-5 text-white">
                <p className="text-sm uppercase tracking-wide text-white/70">Order</p>
                <p className="mt-1 text-4xl font-black">#{shortOrderId(confirmation.id)}</p>
              </div>
              <p className="mt-4 text-base font-bold text-brand-ink">
                {getWaitTimeMessage(confirmation.estimatedWaitMinutes)}
              </p>
              <p className="mt-2 text-sm text-brand-ink/65">Please listen for your name at the pickup area.</p>
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
              {ENABLE_DRINK_LIMITS && <p className="mt-4 text-sm text-brand-ink/60">{confirmation.confirmationMessage}</p>}
              {ENABLE_DRINK_LIMITS && <p className="mt-2 text-sm font-bold text-brand-sea">{confirmation.ticketLabel}</p>}
              <div className="mt-6 grid gap-3">
                <a
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-[#c7a86b] bg-brand-ink px-5 py-3 font-black text-[#fffaf2] shadow-[0_16px_34px_rgba(20,20,20,0.18)]"
                  href={TIP_URL}
                >
                  Tip Your Bartender
                </a>
                <a
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-brand-chrome bg-[#fffaf2] px-5 py-3 font-black text-brand-ink shadow-sm"
                  href={CONNECT_URL}
                >
                  Connect With Rikki's
                </a>
              </div>
              {confirmation.payment && (
                <a
                  className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-brand-ink px-5 py-3 font-black text-white shadow-[0_16px_34px_rgba(20,20,20,0.22)]"
                  href={confirmation.payment.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Complete Payment
                </a>
              )}
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
      <main className="mx-auto max-w-md px-4 pb-32 pt-5">
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
              <h1 className="text-3xl font-black text-brand-ink">Drink menu</h1>
            </div>
          </div>
          </div>
        </header>

        {error && <Alert>{error}</Alert>}
        {restoreError && <RestoreOrderAlert onClear={placeAnotherOrder} />}
        {loading && <Loading label="Loading menu" />}
        {menuUnavailable && !loading && <MenuUnavailable onRefresh={reloadDrinks} />}

        <form onSubmit={submitOrder} className="space-y-5">
          {Object.entries(groupedDrinks).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-ink/55">{category}</h2>
              <div className="grid gap-3">
                {items.map((drink) => (
                  <button
                    key={drink.id}
                    type="button"
                    className={`flex min-h-20 items-center justify-between rounded-2xl border bg-[#fffaf2]/92 px-4 py-3 text-left shadow-[0_10px_28px_rgba(46,46,46,0.07)] transition ${
                      selectedDrink?.id === drink.id ? "border-brand-sea ring-2 ring-brand-sea/20" : "border-brand-chrome/80"
                    }`}
                    onClick={() => setSelectedDrink(drink)}
                  >
                    <span className="min-w-0 pr-3">
                      <span className="block text-lg font-bold text-brand-ink">{drink.name}</span>
                      {drink.description && <span className="line-clamp-2 text-sm text-brand-ink/55">{drink.description}</span>}
                    </span>
                    {selectedDrink?.id === drink.id ? <Check className="h-6 w-6 shrink-0 text-brand-sea" /> : <GlassWater className="h-5 w-5 shrink-0 text-brand-rust/60" />}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[1.5rem] border border-brand-chrome bg-[#fffaf2]/92 p-4 shadow-[0_14px_36px_rgba(46,46,46,0.08)]">
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-bold text-brand-ink/75">Name</span>
                <input className="order-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex" autoComplete="name" />
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
              {ENABLE_DRINK_LIMITS && isValidPhone(phone) && (
                <div className="rounded-2xl border border-brand-chrome/80 bg-white/60 p-3 text-sm font-bold text-brand-ink/75">
                  {checkingTicketCount ? "Checking drink status..." : nextDrinkLabel}
                </div>
              )}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 border-t border-brand-chrome bg-[#fffaf2]/92 p-4 shadow-[0_-18px_45px_rgba(46,46,46,0.10)] backdrop-blur">
            <div className="mx-auto max-w-md">
              <button disabled={!canSubmit} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-4 text-lg font-black text-white shadow-[0_16px_34px_rgba(20,20,20,0.22)] disabled:cursor-not-allowed disabled:bg-brand-chrome disabled:text-brand-ink/50 disabled:shadow-none">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Martini className="h-5 w-5" />}
                {submitButtonLabel}
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
  return <div className="my-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{children}</div>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-brand-chrome bg-[#fffaf2]/92 px-4 py-3 text-brand-ink/65">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function MenuUnavailable({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="rounded-2xl border border-brand-rust/30 bg-[#fffaf2]/92 p-4 text-brand-ink">
      <p className="font-black">Menu unavailable. Please refresh or notify bartender.</p>
      <button className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-brand-rust px-4 py-3 font-bold text-white" onClick={onRefresh} type="button">
        <RefreshCw className="h-4 w-4" />
        Refresh menu
      </button>
    </div>
  );
}

function RestoreOrderAlert({ onClear }: { onClear: () => void }) {
  return (
    <div className="my-3 rounded-2xl border border-brand-rust/30 bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-brand-rust">
      <p>We couldn't restore your last order. Please listen for your name at pickup.</p>
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

async function createOrder(order: Omit<Order, "id" | "created_at">) {
  const configError = requireSupabase("orders.insert");
  if (configError || !orderSupabase) return { data: null, error: configError };

  try {
    const { data, error } = await orderSupabase.from("orders").insert(order).select().single<Order>();
    return { data, error };
  } catch (error) {
    logSupabaseFailure("orders.insert", error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function countGuestOrders(phone: string) {
  const configError = requireSupabase("orders.count");
  if (configError || !orderSupabase) return { count: null, error: configError };

  try {
    const { count, error } = await orderSupabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .in("status", TICKET_COUNT_STATUSES);

    return { count: count ?? 0, error };
  } catch (error) {
    logSupabaseFailure("orders.count", error);
    return { count: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function getOrderById(id: string) {
  const configError = requireSupabase("orders.trackerSelect");
  if (configError || !orderSupabase) return { data: null, error: configError };

  try {
    const { data, error } = await orderSupabase
      .from("orders")
      .select("id,name,phone,drink,status,bar_station,created_at,updated_at")
      .eq("id", id)
      .single<Order>();

    return { data, error };
  } catch (error) {
    logSupabaseFailure("orders.trackerSelect", error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function countActiveQueuedDrinks() {
  const configError = requireSupabase("orders.activeQueueCount");
  if (configError || !orderSupabase) return { count: null, error: configError };

  try {
    const { count, error } = await orderSupabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_QUEUE_STATUSES);

    if (error) return { count: null, error };
    return { count: count ?? 0, error: null };
  } catch (error) {
    logSupabaseFailure("orders.activeQueueCount", error);
    return { count: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function loadDrinks({ setDrinks, setLoading, setError, setUnavailable }: LoadDrinksOptions) {
  setLoading(true);
  setUnavailable(false);

  const configError = requireSupabase("drinks.select");
  if (configError || !orderSupabase) {
    setDrinks(EVENT_DRINK_MENU);
    setLoading(false);
    setError("");
    setUnavailable(false);
    return;
  }

  try {
    const { data, error } = await orderSupabase
      .from("drinks")
      .select("*")
      .eq("active", true)
      .eq("is_available", true)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    setLoading(false);
    if (error || !data?.length) {
      setDrinks(EVENT_DRINK_MENU);
      setError("");
      setUnavailable(false);
      return;
    }

    setError("");
    setDrinks(data as Drink[]);
  } catch (error) {
    logSupabaseFailure("drinks.select", error);
    setLoading(false);
    setDrinks(EVENT_DRINK_MENU);
    setError("");
    setUnavailable(false);
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
    ticketUsed: 0,
    ticketLabel: "",
    confirmationMessage: "Your drink order has been placed.",
    estimatedWaitMinutes,
    payment: null,
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

function getDrinkPayment(drink: Drink): DrinkPayment {
  const category = (drink.category || "").toLowerCase();

  if (category.includes("beer")) {
    return { kind: "beer", price: 3, link: PAYMENT_LINKS.beer };
  }

  if (category.includes("wine")) {
    return { kind: "wine", price: 4, link: PAYMENT_LINKS.wine };
  }

  return { kind: "cocktail", price: 5, link: PAYMENT_LINKS.cocktail };
}

function getNextDrinkLabel(count: number | null, payment: DrinkPayment | null) {
  if (count === null) return "Enter your phone to check complimentary drinks.";
  if (count === 0) return "Free drink 1 of 2";
  if (count === 1) return "Free drink 2 of 2";
  return payment
    ? `You’ve used your 2 complimentary drinks. Additional drinks require payment.`
    : "You’ve used your 2 complimentary drinks. Additional drinks require payment.";
}

function getSubmittedDrinkLabel(existingCount: number, drink: Drink) {
  if (existingCount === 0) return "Free drink 1 of 2";
  if (existingCount === 1) return "Free drink 2 of 2";

  const payment = getDrinkPayment(drink);
  return `Paid drink: $${payment.price}`;
}

function getConfirmationMessage(existingCount: number) {
  if (existingCount < MAX_DRINK_TICKETS) return "Your drink order has been placed.";
  return "Your order has been placed. This drink requires payment.";
}

function getWaitTimeMessage(minutes: number | null) {
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
          { id: "ready", label: normalizedStatus === "completed" ? "Completed / picked up" : "Ready for pickup", active: ["ready", "completed"].includes(normalizedStatus) },
        ].map((step) => (
          <div key={step.id} className={`flex items-center gap-2 text-sm font-bold ${step.active ? "text-brand-ink" : "text-brand-ink/35"}`}>
            <span className={`h-3 w-3 rounded-full ${step.active ? "bg-brand-sea" : "bg-brand-chrome"}`} />
            {step.label}
          </div>
        ))}
      </div>
      <p className="mt-4 text-base font-black text-brand-ink">{getLiveStatusMessage(normalizedStatus, stationName)}</p>
      {liveUpdateError && (
        <p className="mt-3 rounded-xl border border-brand-rust/30 bg-[#fff4eb] px-3 py-2 text-sm font-bold text-brand-rust">
          Live updates are having trouble. Please listen for your name at pickup.
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

function getLiveStatusMessage(status: string, stationName: string) {
  if (status === "in_progress" && stationName) return `Your drink is being made at the ${stationName}.`;
  if (status === "ready" && stationName) return `Your drink is ready at the ${stationName}!`;
  if (status === "ready") return "Your drink is ready! Please head to the pickup area.";
  if (status === "completed") return "Your drink has been picked up. Cheers!";
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
