import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, GlassWater, Loader2, Martini, MessageSquare, RefreshCw } from "lucide-react";

import { orderSupabase, orderSupabaseConfig } from "./orderSupabaseClient";
import "./OrderPage.css";

const BAR_NAME = "Rikki's Mobile Bar";

type Drink = {
  id: string;
  name: string;
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
  const [confirmation, setConfirmation] = useState<Order | null>(null);

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

  const groupedDrinks = useMemo(() => {
    return drinks.reduce<Record<string, Drink[]>>((groups, drink) => {
      const key = drink.category || "House";
      groups[key] = groups[key] || [];
      groups[key].push(drink);
      return groups;
    }, {});
  }, [drinks]);

  const canSubmit = Boolean(selectedDrink && name.trim().length >= 2 && isValidPhone(phone) && smsConsent && !submitting);

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedDrink || !canSubmit) {
      setError("Choose a drink, enter your name, add a valid phone, and accept SMS updates.");
      return;
    }

    setSubmitting(true);
    const { data, error: orderError } = await createOrder({
      name: name.trim(),
      phone: normalizePhone(phone),
      drink: selectedDrink.name,
      status: "New",
    });

    setSubmitting(false);

    if (orderError || !data) {
      setError(`Order could not be submitted. ${orderError?.message || "Please try again."}`);
      return;
    }

    setConfirmation(data);
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
            <div className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              <h1 className="mt-4 text-3xl font-bold text-slate-950">Order received</h1>
              <p className="mt-3 text-slate-600">
                {confirmation.name}, your {confirmation.drink} is in the queue.
              </p>
              <div className="mt-5 rounded-lg bg-slate-950 px-4 py-5 text-white">
                <p className="text-sm uppercase tracking-wide text-slate-300">Order</p>
                <p className="mt-1 text-4xl font-black">#{shortOrderId(confirmation.id)}</p>
              </div>
              <p className="mt-4 text-sm text-slate-500">We will text you when it is ready.</p>
              <button className="mt-6 w-full rounded-lg bg-emerald-600 px-5 py-4 font-bold text-white" onClick={() => setConfirmation(null)}>
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
      <main className="mx-auto max-w-md px-4 pb-28 pt-5">
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Martini className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{BAR_NAME}</p>
              <h1 className="text-3xl font-black text-slate-950">Drink menu</h1>
            </div>
          </div>
        </header>

        {error && <Alert>{error}</Alert>}
        {loading && <Loading label="Loading menu" />}
        {menuUnavailable && !loading && <MenuUnavailable onRefresh={reloadDrinks} />}

        <form onSubmit={submitOrder} className="space-y-5">
          {Object.entries(groupedDrinks).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{category}</h2>
              <div className="grid gap-2">
                {items.map((drink) => (
                  <button
                    key={drink.id}
                    type="button"
                    className={`flex min-h-16 items-center justify-between rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition ${
                      selectedDrink?.id === drink.id ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200"
                    }`}
                    onClick={() => setSelectedDrink(drink)}
                  >
                    <span className="text-lg font-bold text-slate-950">{drink.name}</span>
                    {selectedDrink?.id === drink.id ? <Check className="h-6 w-6 text-emerald-600" /> : <GlassWater className="h-5 w-5 text-slate-400" />}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-bold text-slate-700">Name</span>
                <input className="order-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex" autoComplete="name" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-bold text-slate-700">Phone</span>
                <input
                  className="order-input"
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input className="mt-1 h-5 w-5 accent-emerald-600" type="checkbox" checked={smsConsent} onChange={(event) => setSmsConsent(event.target.checked)} />
                <span className="text-sm font-medium text-slate-700">I agree to receive one SMS update for this drink order.</span>
              </label>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
            <div className="mx-auto max-w-md">
              <button disabled={!canSubmit} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                Submit order
              </button>
            </div>
          </div>
        </form>
      </main>
    </OrderShell>
  );
}

function OrderShell({ children }: { children: ReactNode }) {
  return <div className="order-page min-h-screen bg-[#f8faf8] text-slate-950">{children}</div>;
}

function Alert({ children }: { children: ReactNode }) {
  return <div className="my-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{children}</div>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function MenuUnavailable({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <p className="font-black">Menu unavailable. Please refresh or notify bartender.</p>
      <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-900 px-4 py-3 font-bold text-white" onClick={onRefresh} type="button">
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
