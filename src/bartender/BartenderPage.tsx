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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

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
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
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

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] lg:items-start">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Incoming orders</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{orders.length}</span>
            </div>
            <div className="grid max-h-[68vh] gap-2 overflow-y-auto pr-1">
              {orders.map((order) => (
                <OrderListCard
                  key={order.id}
                  order={order}
                  selected={selectedOrder?.id === order.id}
                  loading={updatingId === order.id}
                  onSelect={() => setSelectedOrderId(order.id)}
                />
              ))}
              {!loading && orders.length === 0 && <EmptyState>No drink orders yet.</EmptyState>}
            </div>
          </div>

          <div className="lg:sticky lg:top-4">
            <OrderDetail
              order={selectedOrder}
              disabled={updatingId !== null}
              loading={selectedOrder ? updatingId === selectedOrder.id : false}
              smsMessage={selectedOrder ? smsState[selectedOrder.id] : ""}
              onStatusChange={(status) => selectedOrder && updateStatus(selectedOrder, status)}
            />
          </div>
        </section>
      </main>
    </BartenderShell>
  );
}

function OrderListCard({
  order,
  selected,
  loading,
  onSelect,
}: {
  order: BartenderOrder;
  selected: boolean;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left shadow-sm transition ${
        selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
      } ${order.status === "Completed" && !selected ? "opacity-55" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-lg font-black ${selected ? "text-white" : "text-slate-950"}`}>{order.name}</p>
          <p className={`line-clamp-1 text-sm font-bold ${selected ? "text-white/80" : "text-slate-600"}`}>{order.drink}</p>
          <p className={`mt-1 text-xs ${selected ? "text-white/55" : "text-slate-400"}`}>
            {order.created_at ? formatOrderTime(order.created_at) : "No time"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          {loading && <Loader2 className={`h-4 w-4 animate-spin ${selected ? "text-white" : "text-slate-500"}`} />}
        </div>
      </div>
    </button>
  );
}

function OrderDetail({
  order,
  disabled,
  loading,
  smsMessage,
  onStatusChange,
}: {
  order: BartenderOrder | null;
  disabled: boolean;
  loading: boolean;
  smsMessage?: string;
  onStatusChange: (status: OrderStatus) => void;
}) {
  if (!order) {
    return <EmptyState>Select an order to view details.</EmptyState>;
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-wide text-slate-400">Active order</p>
          <h2 className="mt-1 text-3xl font-black leading-tight text-slate-950">{order.name}</h2>
          <p className="mt-1 text-xl font-bold text-slate-700">{order.drink}</p>
        </div>
        {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-500" /> : <StatusBadge status={order.status} />}
      </div>

      <dl className="grid grid-cols-2 gap-3 py-4 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="font-black uppercase tracking-wide text-slate-400">Status</dt>
          <dd className="mt-1 font-bold text-slate-900">{order.status}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="font-black uppercase tracking-wide text-slate-400">Time</dt>
          <dd className="mt-1 font-bold text-slate-900">{order.created_at ? formatOrderTime(order.created_at) : "No time"}</dd>
        </div>
        <div className="col-span-2 rounded-lg bg-slate-50 p-3">
          <dt className="font-black uppercase tracking-wide text-slate-400">Order</dt>
          <dd className="mt-1 font-bold text-slate-900">#{shortOrderId(order.id)}</dd>
        </div>
      </dl>

      <div className="grid gap-2">
        <ActionButton
          label="Start"
          disabled={disabled || order.status === "In Progress" || order.status === "Completed"}
          onClick={() => onStatusChange("In Progress")}
        />
        <ActionButton
          label="Ready"
          tone="ready"
          disabled={disabled || order.status === "Ready" || order.status === "Completed"}
          onClick={() => onStatusChange("Ready")}
        />
        <ActionButton
          label="Complete"
          tone="complete"
          disabled={disabled || order.status === "Completed"}
          onClick={() => onStatusChange("Completed")}
        />
      </div>

      {smsMessage && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {smsMessage}
        </p>
      )}
    </article>
  );
}

function ActionButton({
  label,
  tone = "default",
  disabled,
  onClick,
}: {
  label: string;
  tone?: "default" | "ready" | "complete";
  disabled: boolean;
  onClick: () => void;
}) {
  const classes = {
    default: "bg-slate-950 text-white hover:bg-slate-800",
    ready: "bg-emerald-700 text-white hover:bg-emerald-800",
    complete: "bg-slate-100 text-slate-950 hover:bg-slate-200",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-16 w-full rounded-lg px-5 text-xl font-black shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${classes[tone]}`}
    >
      {label}
    </button>
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
    New: "bg-slate-100 text-slate-700",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Ready: "bg-emerald-100 text-emerald-800",
    Completed: "bg-slate-100 text-slate-400",
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
