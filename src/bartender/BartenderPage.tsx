import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  Martini,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { orderSupabase, orderSupabaseConfig } from "../order/orderSupabaseClient";

type OrderStatus = "New" | "In Progress" | "Ready" | "Completed";

type BartenderOrder = {
  id: string;
  name: string;
  phone: string;
  drink: string;
  status: OrderStatus;
  created_at?: string;
  ready_sms_sent_at?: string | null;
};

const STATUSES: OrderStatus[] = ["New", "In Progress", "Ready", "Completed"];
const ACTIVE_STATUSES: OrderStatus[] = ["New", "In Progress", "Ready"];
const BARTENDER_PIN = import.meta.env.VITE_BARTENDER_PIN?.trim() || "";
const PIN_SESSION_KEY = "rikki-bartender-pin-ok";

export default function BartenderPage() {
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem(PIN_SESSION_KEY) === "true");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [orders, setOrders] = useState<BartenderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [smsState, setSmsState] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authorized) return undefined;

    loadOrders({ setOrders, setLoading, setError });

    if (!orderSupabase) return undefined;

    const channel = orderSupabase
      .channel("bartender-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders({ setOrders, setLoading, setError });
      })
      .subscribe();

    return () => {
      orderSupabase.removeChannel(channel);
    };
  }, [authorized]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "Completed").slice(0, 12),
    [orders]
  );

  const unlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinError("");

    if (!BARTENDER_PIN) {
      setPinError("Bartender PIN is not configured. Add VITE_BARTENDER_PIN in Vercel.");
      return;
    }

    if (pin.trim() !== BARTENDER_PIN) {
      setPinError("Incorrect PIN.");
      return;
    }

    sessionStorage.setItem(PIN_SESSION_KEY, "true");
    setAuthorized(true);
    setPin("");
  };

  const updateStatus = async (order: BartenderOrder, status: OrderStatus) => {
    if (order.status === status || updatingId) return;

    setUpdatingId(order.id);
    setError("");
    setSmsState((current) => ({ ...current, [order.id]: "" }));

    const { error: updateError } = await updateOrderStatus(order.id, status);

    if (updateError) {
      setError(`Order status could not be updated. ${updateError.message}`);
      setUpdatingId(null);
      return;
    }

    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)));

    if (status === "Ready" && order.status !== "Ready" && !order.ready_sms_sent_at) {
      setSmsState((current) => ({ ...current, [order.id]: "Sending ready text..." }));
      const smsResult = await sendReadySms(order);
      setSmsState((current) => ({
        ...current,
        [order.id]: smsResult.ok ? "Ready text sent." : smsResult.message,
      }));
    }

    setUpdatingId(null);
  };

  if (!authorized) {
    return (
      <BartenderShell>
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
          <form onSubmit={unlock} className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Rikki's Mobile Bar</p>
                <h1 className="text-3xl font-black text-slate-950">Bartender</h1>
              </div>
            </div>
            <label className="mt-6 grid gap-2">
              <span className="text-sm font-bold text-slate-700">PIN</span>
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="min-h-12 rounded-lg border border-slate-300 px-4 text-lg font-bold text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
                type="password"
                autoComplete="current-password"
              />
            </label>
            {pinError && <Alert>{pinError}</Alert>}
            <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-black text-white">
              <ShieldCheck className="h-5 w-5" />
              Unlock queue
            </button>
          </form>
        </main>
      </BartenderShell>
    );
  }

  return (
    <BartenderShell>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Martini className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Live queue</p>
              <h1 className="text-3xl font-black text-slate-950">Bartender dashboard</h1>
            </div>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-700 shadow-sm"
            onClick={() => loadOrders({ setOrders, setLoading, setError })}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {error && <Alert>{error}</Alert>}
        {loading && <Loading label="Loading order queue" />}

        <section className="grid gap-3">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              disabled={updatingId !== null}
              loading={updatingId === order.id}
              smsMessage={smsState[order.id]}
              onStatusChange={(status) => updateStatus(order, status)}
            />
          ))}
          {!loading && activeOrders.length === 0 && (
            <EmptyState>No active drink orders right now.</EmptyState>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Recently completed</h2>
          <div className="grid gap-2">
            {completedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                <span className="font-bold text-slate-900">{order.name}</span>
                <span className="text-slate-600">{order.drink}</span>
              </div>
            ))}
            {!loading && completedOrders.length === 0 && <EmptyState>No completed orders yet.</EmptyState>}
          </div>
        </section>
      </main>
    </BartenderShell>
  );
}

function OrderCard({
  order,
  disabled,
  loading,
  smsMessage,
  onStatusChange,
}: {
  order: BartenderOrder;
  disabled: boolean;
  loading: boolean;
  smsMessage?: string;
  onStatusChange: (status: OrderStatus) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-950">{order.drink}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 font-bold text-slate-700">{order.name}</p>
          <p className="text-sm text-slate-500">
            #{shortOrderId(order.id)} {order.created_at ? `- ${formatOrderTime(order.created_at)}` : ""}
          </p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-black transition ${
              order.status === status
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={disabled || order.status === status}
            onClick={() => onStatusChange(status)}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      {smsMessage && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {smsMessage}
        </p>
      )}
    </article>
  );
}

function BartenderShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f8faf8] text-slate-950">{children}</div>;
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

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 font-bold text-slate-500">
      <Clock3 className="h-5 w-5" />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const classes: Record<OrderStatus, string> = {
    New: "bg-sky-100 text-sky-800",
    "In Progress": "bg-amber-100 text-amber-800",
    Ready: "bg-emerald-100 text-emerald-800",
    Completed: "bg-slate-100 text-slate-700",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${classes[status]}`}>{status}</span>;
}

function requireSupabase(operation: string) {
  if (orderSupabase) return null;
  const error = new Error(orderSupabaseConfig.error || "Supabase is not configured.");
  console.error("[Supabase request failed]", { operation, message: error.message });
  return error;
}

async function loadOrders({
  setOrders,
  setLoading,
  setError,
}: {
  setOrders: (orders: BartenderOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}) {
  setLoading(true);

  const configError = requireSupabase("orders.select");
  if (configError || !orderSupabase) {
    setLoading(false);
    setOrders([]);
    setError(configError?.message || "Supabase is not configured.");
    return;
  }

  const { data, error } = await orderSupabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(75);

  setLoading(false);

  if (error) {
    setOrders([]);
    setError(error.message);
    return;
  }

  setError("");
  setOrders((data || []) as BartenderOrder[]);
}

async function updateOrderStatus(id: string, status: OrderStatus) {
  const configError = requireSupabase("orders.update");
  if (configError || !orderSupabase) return { error: configError || new Error("Supabase is not configured.") };

  try {
    const { error } = await orderSupabase.from("orders").update({ status }).eq("id", id);
    return { error };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function sendReadySms(order: BartenderOrder) {
  try {
    const response = await fetch("/api/send-ready-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bartender-Pin": BARTENDER_PIN,
      },
      body: JSON.stringify({
        orderId: order.id,
        name: order.name,
        phone: order.phone,
        drink: order.drink,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string; skipped?: boolean } | null;

    if (!response.ok) {
      return { ok: false, message: payload?.message || "Ready text could not be sent." };
    }

    return { ok: true, message: payload?.skipped ? "Ready text was already sent." : "Ready text sent." };
  } catch (error) {
    console.error("[Ready SMS failed]", error);
    return { ok: false, message: "Ready text could not be sent." };
  }
}

function shortOrderId(id: string) {
  return String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
