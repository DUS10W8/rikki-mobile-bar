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
  updated_at?: string;
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

  const { needsMadeOrders, readyOrders, completedOrders } = useMemo(() => {
    const byCreatedAtAsc = (a: BartenderOrder, b: BartenderOrder) => getOrderTime(a) - getOrderTime(b);
    const byReadyTimeAsc = (a: BartenderOrder, b: BartenderOrder) => getReadyTime(a) - getReadyTime(b);

    return {
      needsMadeOrders: orders
        .filter((order) => order.status === "New" || order.status === "In Progress")
        .sort(byCreatedAtAsc),
      readyOrders: orders.filter((order) => order.status === "Ready").sort(byReadyTimeAsc),
      completedOrders: orders.filter((order) => order.status === "Completed").sort(byCreatedAtAsc),
    };
  }, [orders]);

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
          <form onSubmit={unlock} className="rounded-2xl border border-brand-chrome bg-[#fffaf2]/90 p-6 shadow-[0_24px_70px_rgba(46,46,46,0.12)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-chrome bg-brand-ink text-white shadow-[0_10px_24px_rgba(20,20,20,0.18)]">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand-sea">Rikki's Mobile Bar</p>
                <h1 className="font-heading text-3xl font-black text-brand-ink">Bartender</h1>
              </div>
            </div>
            <label className="mt-6 grid gap-2">
              <span className="text-sm font-bold text-brand-ink/70">PIN</span>
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="min-h-12 rounded-2xl border border-brand-chrome bg-[#fffaf2] px-4 text-lg font-bold text-brand-ink outline-none focus:border-brand-sea focus:ring-2 focus:ring-brand-sea/20"
                inputMode="numeric"
                type="password"
                autoComplete="current-password"
              />
            </label>
            {pinError && <Alert>{pinError}</Alert>}
            <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 font-black text-white shadow-[0_16px_34px_rgba(20,20,20,0.22)]">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-chrome bg-brand-ink text-white shadow-[0_10px_24px_rgba(20,20,20,0.18)]">
              <Martini className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-sea">Live queue</p>
              <h1 className="font-heading text-3xl font-black text-brand-ink">Bartender dashboard</h1>
            </div>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-brand-chrome bg-[#fffaf2]/90 px-4 font-bold text-brand-ink shadow-sm"
            onClick={() => loadOrders({ setOrders, setLoading, setError })}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {error && <Alert>{error}</Alert>}
        {loading && <Loading label="Loading order queue" />}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardHeader title="Needs Made" count={needsMadeOrders.length} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {needsMadeOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled={updatingId !== null}
                  loading={updatingId === order.id}
                  smsMessage={smsState[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && needsMadeOrders.length === 0 && <EmptyState>No drinks need to be made.</EmptyState>}
            </div>
          </div>

          <aside>
            <BoardHeader title="Ready for Pickup" count={readyOrders.length} tone="ready" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {readyOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled={updatingId !== null}
                  loading={updatingId === order.id}
                  smsMessage={smsState[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && readyOrders.length === 0 && <EmptyState>No drinks ready for pickup.</EmptyState>}
            </div>
          </aside>
        </section>

        {completedOrders.length > 0 && (
          <section className="mt-8 border-t border-slate-200 pt-5">
            <BoardHeader title="Completed" count={completedOrders.length} />
            <div className="grid gap-3 opacity-75 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {completedOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled
                  loading={false}
                  smsMessage={smsState[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </BartenderShell>
  );
}

function BoardHeader({ title, count, tone = "default" }: { title: string; count: number; tone?: "default" | "ready" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className={`font-heading text-xl font-black ${tone === "ready" ? "text-brand-sea" : "text-brand-ink"}`}>
        {title}
      </h2>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${tone === "ready" ? "border-brand-sea/25 bg-brand-sea/10 text-brand-sea" : "border-brand-chrome bg-[#fffaf2]/90 text-brand-ink/65"}`}>
        {count}
      </span>
    </div>
  );
}

function KitchenOrderCard({
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
  const style = getStatusCardStyle(order.status);
  const actions = getOrderActions(order.status);
  const isCompactCard = order.status === "Ready" || order.status === "Completed";

  return (
    <article className={`flex flex-col overflow-hidden rounded-xl border shadow-sm ${isCompactCard ? "" : "min-h-[360px]"} ${style.card}`}>
      <div className={`h-2 ${style.bar}`} />
      <div className={`flex flex-1 flex-col ${isCompactCard ? "p-3" : "p-4"}`}>
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 font-heading text-2xl font-black leading-tight text-brand-ink">{order.name}</h2>
            <span className="shrink-0 pt-1 text-xs font-black text-brand-ink/45">{order.created_at ? formatOrderTime(order.created_at) : "No time"}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-lg font-bold leading-snug text-brand-ink/72">{order.drink}</p>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-ink/55" /> : <StatusBadge status={order.status} />}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-brand-chrome/60 bg-[#fffaf2]/70 px-3 py-2 text-sm font-black uppercase tracking-wide text-brand-ink/45">
          #{shortOrderId(order.id)}
        </div>

        {actions.length > 0 && (
          <div className={`grid gap-2 ${isCompactCard ? "pt-3" : "mt-auto pt-4"}`}>
            {actions.map((action) => (
              <ActionButton
                key={action.status}
                label={action.label}
                tone={action.tone}
                disabled={disabled || order.status === action.status}
                onClick={() => onStatusChange(action.status)}
              />
            ))}
          </div>
        )}

        {smsMessage && (
          <p className="mt-2 flex items-center gap-1.5 rounded-md bg-brand-sea/10 px-2.5 py-1.5 text-xs font-bold text-brand-sea">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {smsMessage}
          </p>
        )}
      </div>
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
    default: "bg-brand-ink text-white hover:bg-[#242424]",
    ready: "bg-brand-sea text-white hover:bg-[#257d70]",
    complete: "border border-brand-chrome bg-[#f3ece2] text-brand-ink hover:bg-[#ece2d6]",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 w-full rounded-2xl px-5 text-lg font-black shadow-sm transition disabled:cursor-not-allowed disabled:bg-brand-chrome disabled:text-brand-ink/45 disabled:shadow-none ${classes[tone]}`}
    >
      {label}
    </button>
  );
}

function getOrderActions(status: OrderStatus) {
  if (status === "New") {
    return [
      { label: "Start", status: "In Progress" as const, tone: "default" as const },
      { label: "Ready", status: "Ready" as const, tone: "ready" as const },
    ];
  }

  if (status === "In Progress") {
    return [{ label: "Ready", status: "Ready" as const, tone: "ready" as const }];
  }

  if (status === "Ready") {
    return [{ label: "Complete", status: "Completed" as const, tone: "complete" as const }];
  }

  return [];
}

function BartenderShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffaf2_0%,_#eadfc6_52%,_#e2d2b8_100%)] text-brand-ink">
      {children}
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return <div className="my-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{children}</div>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-brand-chrome bg-[#fffaf2]/90 px-4 py-3 text-brand-ink/65">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-brand-chrome bg-[#fffaf2]/70 px-4 py-6 font-bold text-brand-ink/55">
      <Clock3 className="h-5 w-5" />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const classes: Record<OrderStatus, string> = {
    New: "border border-brand-chrome bg-[#fffaf2] text-brand-ink/70",
    "In Progress": "border border-[#d6bd7b]/40 bg-[#f5edda] text-[#715d2b]",
    Ready: "border border-brand-sea/25 bg-brand-sea/10 text-brand-sea",
    Completed: "border border-brand-chrome bg-[#eee6da] text-brand-ink/35",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${classes[status]}`}>{status}</span>;
}

function getStatusCardStyle(status: OrderStatus) {
  const styles: Record<OrderStatus, { card: string; bar: string }> = {
    New: {
      card: "border-brand-chrome bg-[#fffaf2]/94 shadow-[0_14px_36px_rgba(46,46,46,0.08)]",
      bar: "bg-brand-ink",
    },
    "In Progress": {
      card: "border-[#d8c48b]/60 bg-[#fff7e6]/94 shadow-[0_14px_36px_rgba(46,46,46,0.08)]",
      bar: "bg-[#b49a54]",
    },
    Ready: {
      card: "border-brand-sea/25 bg-[#f4fbf7]/94 shadow-[0_12px_30px_rgba(46,46,46,0.07)]",
      bar: "bg-brand-sea",
    },
    Completed: {
      card: "border-brand-chrome bg-[#eee6da]/80 opacity-55",
      bar: "bg-brand-chrome",
    },
  };

  return styles[status];
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

function getOrderTime(order: BartenderOrder) {
  if (!order.created_at) return Number.MAX_SAFE_INTEGER;
  const time = new Date(order.created_at).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function getReadyTime(order: BartenderOrder) {
  const readyishTime = order.ready_sms_sent_at || order.updated_at || order.created_at;
  if (!readyishTime) return Number.MAX_SAFE_INTEGER;
  const time = new Date(readyishTime).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}
