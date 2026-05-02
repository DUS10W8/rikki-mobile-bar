import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, GlassWater, Loader2, Martini, MessageSquare, RefreshCw } from "lucide-react";

import { orderSupabase, orderSupabaseConfig } from "./orderSupabaseClient";
import "./OrderPage.css";

const BAR_NAME = "Rikki's Mobile Bar";
const BASE = import.meta.env.BASE_URL;
const MAX_DRINK_TICKETS = 2;
const TICKET_COUNT_STATUSES = ["new", "in_progress", "ready", "completed", "New", "In Progress", "Ready", "Completed"];
const PAYMENT_LINKS = {
  beer: "PASTE_BEER_SQUARE_LINK_HERE",
  wine: "PASTE_WINE_SQUARE_LINK_HERE",
  cocktail: "PASTE_COCKTAIL_SQUARE_LINK_HERE",
};

type Drink = {
  id: string;
  name: string;
  description?: string | null;
  category: string | null;
  active: boolean;
};

type Order = {
  id: string;
  name: string;
  phone: string;
  drink: string;
  status: "New" | "In Progress" | "Ready" | "Completed";
  created_at?: string;
};

type OrderConfirmation = Order & {
  ticketUsed: number;
  ticketLabel: string;
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
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuUnavailable, setMenuUnavailable] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [guestOrderCount, setGuestOrderCount] = useState<number | null>(null);
  const [checkingTicketCount, setCheckingTicketCount] = useState(false);

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

  const groupedDrinks = useMemo(() => {
    return drinks.reduce<Record<string, Drink[]>>((groups, drink) => {
      const key = drink.category || "House";
      groups[key] = groups[key] || [];
      groups[key].push(drink);
      return groups;
    }, {});
  }, [drinks]);

  const canSubmit = Boolean(selectedDrink && name.trim().length >= 2 && isValidPhone(phone) && smsConsent && !submitting);
  const selectedDrinkPayment = selectedDrink ? getDrinkPayment(selectedDrink) : null;
  const nextDrinkLabel = getNextDrinkLabel(guestOrderCount, selectedDrinkPayment);
  const isPaidNextDrink = Boolean(guestOrderCount !== null && guestOrderCount >= MAX_DRINK_TICKETS && selectedDrinkPayment);
  const submitButtonLabel = isPaidNextDrink && selectedDrinkPayment ? `Order Drink ($${selectedDrinkPayment.price})` : "Submit order";

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedDrink || !canSubmit) {
      setError("Choose a drink, enter your name, add a valid phone, and accept SMS updates.");
      return;
    }

    setSubmitting(true);
    const normalizedPhone = normalizePhone(phone);
    const { count: existingTicketCount, error: ticketError } = await countGuestOrders(normalizedPhone);

    if (ticketError || existingTicketCount === null) {
      setSubmitting(false);
      setError(`Order could not be submitted. ${ticketError?.message || "Could not verify drink tickets."}`);
      return;
    }

    const { data, error: orderError } = await createOrder({
      name: name.trim(),
      phone: normalizedPhone,
      drink: selectedDrink.name,
      status: "New",
    });

    setSubmitting(false);

    if (orderError || !data) {
      setError(`Order could not be submitted. ${orderError?.message || "Please try again."}`);
      return;
    }

    setGuestOrderCount(existingTicketCount + 1);
    setConfirmation({ ...data, ticketUsed: existingTicketCount + 1, ticketLabel: getSubmittedDrinkLabel(existingTicketCount, selectedDrink) });
    setSelectedDrink(null);
    setName("");
    setPhone("");
    setSmsConsent(false);
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
              <h1 className="mt-4 text-3xl font-bold text-brand-ink">Order received</h1>
              <p className="mt-3 text-brand-ink/70">
                {confirmation.name}, your {confirmation.drink} is in the queue.
              </p>
              <div className="mt-5 rounded-2xl bg-brand-ink px-4 py-5 text-white">
                <p className="text-sm uppercase tracking-wide text-white/70">Order</p>
                <p className="mt-1 text-4xl font-black">#{shortOrderId(confirmation.id)}</p>
              </div>
              <p className="mt-4 text-sm text-brand-ink/60">We will text you when it is ready.</p>
              <p className="mt-2 text-sm font-bold text-brand-sea">{confirmation.ticketLabel}</p>
              <button className="mt-6 w-full rounded-2xl bg-brand-sea px-5 py-4 font-bold text-white shadow-[0_14px_32px_rgba(46,155,138,0.25)]" onClick={() => setConfirmation(null)}>
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
                <span className="text-sm font-bold text-brand-ink/75">Phone</span>
                <input
                  className="order-input"
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-brand-chrome/80 bg-white/60 p-3">
                <input className="mt-1 h-5 w-5 accent-brand-sea" type="checkbox" checked={smsConsent} onChange={(event) => setSmsConsent(event.target.checked)} />
                <span className="text-sm font-medium text-brand-ink/75">I agree to receive one SMS update for this drink order.</span>
              </label>
              {isValidPhone(phone) && (
                <div className="rounded-2xl border border-brand-chrome/80 bg-white/60 p-3 text-sm font-bold text-brand-ink/75">
                  {checkingTicketCount ? "Checking drink status..." : nextDrinkLabel}
                </div>
              )}
              {isPaidNextDrink && selectedDrinkPayment && (
                <a
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-brand-chrome bg-[#f3ece2] px-4 text-sm font-black text-brand-ink shadow-sm"
                  href={selectedDrinkPayment.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pay Now
                </a>
              )}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 border-t border-brand-chrome bg-[#fffaf2]/92 p-4 shadow-[0_-18px_45px_rgba(46,46,46,0.10)] backdrop-blur">
            <div className="mx-auto max-w-md">
              <button disabled={!canSubmit} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-4 text-lg font-black text-white shadow-[0_16px_34px_rgba(20,20,20,0.22)] disabled:cursor-not-allowed disabled:bg-brand-chrome disabled:text-brand-ink/50 disabled:shadow-none">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
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

function friendlyDataError(action: string, error: Error) {
  if (orderSupabaseConfig.error) return `${action} ${orderSupabaseConfig.error}`;
  if (error.message === "Failed to fetch") {
    return `${action} Could not reach Supabase. Check VITE_SUPABASE_URL, network access, CORS, and whether the project URL is correct.`;
  }
  return `${action} ${error.message || "Unknown error."}`;
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

async function loadDrinks({ setDrinks, setLoading, setError, setUnavailable }: LoadDrinksOptions) {
  setLoading(true);
  setUnavailable(false);

  const configError = requireSupabase("drinks.select");
  if (configError || !orderSupabase) {
    setLoading(false);
    setDrinks([]);
    setUnavailable(true);
    setError(friendlyDataError("Menu could not be loaded.", configError || new Error("Supabase is not configured.")));
    return;
  }

  try {
    const { data, error } = await orderSupabase.from("drinks").select("*").eq("active", true).order("category").order("name");

    setLoading(false);
    if (error) {
      setDrinks([]);
      setUnavailable(true);
      setError(friendlyDataError("Menu could not be loaded.", error));
    } else {
      setError("");
      setDrinks((data || []) as Drink[]);
    }
  } catch (error) {
    const requestError = error instanceof Error ? error : new Error(String(error));
    logSupabaseFailure("drinks.select", requestError);
    setLoading(false);
    setDrinks([]);
    setUnavailable(true);
    setError(friendlyDataError("Menu could not be loaded.", requestError));
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
