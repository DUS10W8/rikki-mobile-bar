import WalkupOrders from "./WalkupOrders";
import { HANDOFF_LABELS, shortOrderId } from "../order/orderHandoff";
import type { OrderHandoff } from "../order/orderHandoff";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  GlassWater,
  Loader2,
  LockKeyhole,
  Martini,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { BARTENDER_POLL_INTERVAL_MS, ENABLE_DRINK_LIMITS, ENABLE_READY_SMS } from "../order/eventConfig";
import { EVENT_DRINK_MENU } from "../order/eventMenu";
import { orderSupabase } from "../order/orderSupabaseClient";

type NormalizedOrderStatus = "new" | "in_progress" | "ready" | "completed";
type OrderStatus = NormalizedOrderStatus | "New" | "In Progress" | "Ready" | "Completed";
type BarStation = "white_bar" | "brown_bar";

type BartenderOrder = {
  id: string;
  name: string;
  phone: string;
  drink: string;
  status: OrderStatus;
  bar_station?: BarStation | null;
  square_order_id?: string | null;
  handoff?: OrderHandoff | null;
  table_number?: number | null;
  created_at?: string;
  updated_at?: string;
  ready_sms_sent_at?: string | null;
};

type DrinkMenuItem = {
  name: string;
  category: string | null;
};

// Staff unlock with the server-checked WALKUP_STAFF_CODE. The server sets a 12-hour
// HttpOnly session shared with the walk-up register; nothing secret ships in this bundle.
const ORDERS_API = "/api/bartender-orders";
let staffCodeForNextRequest = "";
const STATION_STORAGE_KEY = "rikki-bartender-station";
const MAX_DRINK_TICKETS = 2;

export default function BartenderPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "ready") return <ReadyBoard />;
  // Order-taker's iPad: the register on its own, without the drink board.
  if (params.get("view") === "register") {
    return <main className="min-h-screen bg-[#EADFC6] p-2 sm:p-3"><WalkupOrders /></main>;
  }
  if (params.get("walkup") === "phone" || params.has("data")) {
    return <main className="mx-auto max-w-lg p-4"><WalkupOrders phone /></main>;
  }
  return <BartenderDashboard />;
}

function BartenderDashboard() {
  const [showWalkup, setShowWalkup] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [station, setStation] = useState<BarStation | "">(() => {
    const savedStation = localStorage.getItem(STATION_STORAGE_KEY);
    return savedStation === "white_bar" || savedStation === "brown_bar" ? savedStation : "";
  });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [orders, setOrders] = useState<BartenderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [smsState, setSmsState] = useState<Record<string, string>>({});
  const [drinkMenu, setDrinkMenu] = useState<DrinkMenuItem[]>([]);
  const [showCompletedMobile, setShowCompletedMobile] = useState(false);
  const primedNewOrderIdsRef = useRef(false);
  const newOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Restore an existing staff session (cookie) without asking for the code again.
    let ignore = false;
    void staffFetch(ORDERS_API).then((response) => {
      if (ignore) return;
      setAuthorized(response.ok);
      setCheckingAccess(false);
    }).catch(() => !ignore && setCheckingAccess(false));
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!authorized) return undefined;

    const refreshOrders = (silent = false) => loadOrders({ setOrders, setLoading, setError, silent, onLocked: () => setAuthorized(false) });

    refreshOrders();
    loadDrinkMenu({ setDrinkMenu });
    const pollId = window.setInterval(() => refreshOrders(true), BARTENDER_POLL_INTERVAL_MS);
    return () => window.clearInterval(pollId);
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    const currentNewIds = new Set(orders.filter((order) => normalizeOrderStatus(order.status) === "new").map((order) => order.id));

    if (!primedNewOrderIdsRef.current) {
      newOrderIdsRef.current = currentNewIds;
      primedNewOrderIdsRef.current = true;
      return;
    }

    const hasFreshOrder = [...currentNewIds].some((id) => !newOrderIdsRef.current.has(id));
    newOrderIdsRef.current = currentNewIds;

    if (hasFreshOrder) playNewOrderDing();
  }, [authorized, orders]);

  const { newOrders, inProgressOrders, readyOrders, completedOrders, activeQueueCount } = useMemo(() => {
    const byCreatedAtAsc = (a: BartenderOrder, b: BartenderOrder) => getOrderTime(a) - getOrderTime(b);
    const byReadyTimeAsc = (a: BartenderOrder, b: BartenderOrder) => getReadyTime(a) - getReadyTime(b);

    const newOrders = orders.filter((order) => normalizeOrderStatus(order.status) === "new").sort(byCreatedAtAsc);
    const inProgressOrders = orders.filter((order) => normalizeOrderStatus(order.status) === "in_progress").sort(byCreatedAtAsc);

    return {
      newOrders,
      inProgressOrders,
      readyOrders: orders.filter((order) => normalizeOrderStatus(order.status) === "ready").sort(byReadyTimeAsc),
      completedOrders: orders.filter((order) => normalizeOrderStatus(order.status) === "completed").sort(byCreatedAtAsc),
      activeQueueCount: newOrders.length + inProgressOrders.length,
    };
  }, [orders]);
  const ticketLabelsByOrderId = useMemo(() => (ENABLE_DRINK_LIMITS ? getTicketLabelsByOrderId(orders, drinkMenu) : {}), [orders, drinkMenu]);

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinError("");
    const code = pin.trim();
    if (!code) return;
    staffCodeForNextRequest = code;
    const response = await staffFetch(ORDERS_API).catch(() => null);
    staffCodeForNextRequest = "";
    if (!response) {
      setPinError("Could not reach the server. Check the connection and try again.");
      return;
    }
    if (response.status === 401) {
      setPinError("That staff code was not accepted.");
      return;
    }
    if (!response.ok) {
      setPinError("The queue is unavailable right now.");
      return;
    }
    setAuthorized(true);
    setPin("");
  };

  const chooseStation = (nextStation: BarStation) => {
    localStorage.setItem(STATION_STORAGE_KEY, nextStation);
    setStation(nextStation);
  };

  const changeStation = () => {
    localStorage.removeItem(STATION_STORAGE_KEY);
    setStation("");
  };

  const updateStatus = async (order: BartenderOrder, status: NormalizedOrderStatus) => {
    if (normalizeOrderStatus(order.status) === status || updatingId) return;
    if (status === "in_progress" && !station) {
      setError("Choose White Bar or Brown Bar before starting orders.");
      return;
    }

    const nextStation = status === "in_progress" && !order.bar_station ? station || null : undefined;

    setUpdatingId(order.id);
    setError("");
    setSmsState((current) => ({ ...current, [order.id]: "" }));

    const { error: updateError } = await updateOrderStatus(order.id, status, nextStation);

    if (updateError) {
      setError(`Order status could not be updated. ${updateError.message}`);
      setUpdatingId(null);
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === order.id
          ? { ...item, status: toPersistedOrderStatus(status), bar_station: nextStation === undefined ? item.bar_station : nextStation, updated_at: new Date().toISOString() }
          : item,
      ),
    );

    if (ENABLE_READY_SMS && status === "ready" && normalizeOrderStatus(order.status) !== "ready" && !order.ready_sms_sent_at) {
      setSmsState((current) => ({ ...current, [order.id]: "Sending ready text..." }));
      const smsResult = await sendReadySms(order);
      setSmsState((current) => ({
        ...current,
        [order.id]: smsResult.ok ? "Ready text sent." : smsResult.message,
      }));
    }

    setUpdatingId(null);
  };

  if (checkingAccess) {
    return <BartenderShell><main className="mx-auto max-w-md px-5 py-16 text-center font-bold text-brand-ink/70" role="status">Checking staff access…</main></BartenderShell>;
  }

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
              <span className="text-sm font-bold text-brand-ink/70">Staff code</span>
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="min-h-12 rounded-2xl border border-brand-chrome bg-[#fffaf2] px-4 text-lg font-bold text-brand-ink outline-none focus:border-brand-sea focus:ring-2 focus:ring-brand-sea/20"
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

  if (!station) {
    return (
      <BartenderShell>
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
          <section className="rounded-2xl border border-brand-chrome bg-[#fffaf2]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <p className="text-sm font-black uppercase tracking-wide text-brand-sea">Rikki's Mobile Bar</p>
            <h1 className="mt-1 font-heading text-3xl font-black text-brand-ink">Choose station</h1>
            <p className="mt-2 text-sm font-semibold text-brand-ink/65">Orders you start will be assigned to this bar for preparation and guest handoff.</p>
            <div className="mt-6 grid gap-3">
              <button className="min-h-16 rounded-2xl bg-brand-ink px-5 text-xl font-black text-white" type="button" onClick={() => chooseStation("white_bar")}>
                White Bar
              </button>
              <button className="min-h-16 rounded-2xl border border-brand-chrome bg-[#efe0cc] px-5 text-xl font-black text-brand-ink" type="button" onClick={() => chooseStation("brown_bar")}>
                Brown Bar
              </button>
            </div>
          </section>
        </main>
      </BartenderShell>
    );
  }

  return (
    <BartenderShell>
      <main className="mx-auto max-w-6xl px-2 pb-16 pt-2 sm:px-4 sm:pt-5">
        <header className="mb-2 flex flex-col gap-2 sm:mb-5 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-chrome bg-brand-ink text-white shadow-[0_10px_24px_rgba(20,20,20,0.18)] sm:h-12 sm:w-12 sm:rounded-2xl">
              <Martini className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-sea sm:text-sm">Live queue</p>
              <h1 className="font-heading text-xl font-black text-[#fffaf2] sm:text-3xl">Bartender dashboard</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                <span className="rounded-full border border-brand-sea/30 bg-brand-sea/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-sea">
                  Station: {getStationLabel(station)}
                </span>
                <span className="rounded-full bg-[#fffaf2]/90 px-3 py-1 text-xs font-black text-brand-ink">
                  {activeQueueCount} in queue
                </span>
                <button className="rounded-full border border-brand-chrome bg-[#fffaf2]/90 px-3 py-1 text-xs font-black text-brand-ink" type="button" onClick={changeStation}>
                  Change station
                </button>
              </div>
            </div>
          </div>
          <button
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-chrome bg-[#fffaf2]/90 px-3 text-sm font-bold text-brand-ink shadow-sm sm:min-h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-base"
            onClick={() => loadOrders({ setOrders, setLoading, setError, onLocked: () => setAuthorized(false) })}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {error && <Alert>{error}</Alert>}
        {loading && <Loading label="Loading order queue" />}

        <SectionQuickNav
          counts={{
            newOrders: newOrders.length,
            inProgress: inProgressOrders.length,
            ready: readyOrders.length,
            completed: completedOrders.length,
          }}
          onCompletedClick={() => setShowCompletedMobile(true)}
        />


        <div className="my-3">
          <button type="button" className="rounded-xl bg-brand-ink px-4 py-2 font-bold text-white" aria-expanded={showWalkup} onClick={() => setShowWalkup((open) => !open)}>
            {showWalkup ? "Hide register" : "Register"}
          </button>
          <a className="ml-3 text-sm font-bold text-[#fffaf2] underline" href="/bartender?view=register">Open register on its own</a>
          {showWalkup && <div className="mt-3"><WalkupOrders /></div>}
        </div>
        <section className="grid gap-3 md:grid-cols-3">
          <DashboardColumn id="new-orders" title="New" count={newOrders.length}>
            <div className="grid gap-3">
              {newOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled={updatingId !== null}
                  loading={updatingId === order.id}
                  smsMessage={smsState[order.id]}
                  ticketLabel={ticketLabelsByOrderId[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && newOrders.length === 0 && <EmptyState>No new orders.</EmptyState>}
            </div>
          </DashboardColumn>

          <DashboardColumn id="in-progress-orders" title="In Progress" count={inProgressOrders.length} tone="progress">
            <div className="grid gap-3">
              {inProgressOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled={updatingId !== null}
                  loading={updatingId === order.id}
                  smsMessage={smsState[order.id]}
                  ticketLabel={ticketLabelsByOrderId[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && inProgressOrders.length === 0 && <EmptyState>Nothing started yet.</EmptyState>}
            </div>
          </DashboardColumn>

          <DashboardColumn id="ready-orders" title="Ready / On the Way" count={readyOrders.length} tone="ready">
            <div className="grid gap-3">
              {readyOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled={updatingId !== null}
                  loading={updatingId === order.id}
                  smsMessage={smsState[order.id]}
                  ticketLabel={ticketLabelsByOrderId[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && readyOrders.length === 0 && <EmptyState>No drinks ready for handoff.</EmptyState>}
            </div>
          </DashboardColumn>

          <DashboardColumn
            id="completed-orders"
            title="Completed"
            count={completedOrders.length}
            tone="completed"
            className={showCompletedMobile ? "md:col-span-3" : "hidden"}
          >
            <div className="grid gap-3">
              {completedOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  disabled
                  loading={false}
                  smsMessage={smsState[order.id]}
                  ticketLabel={ticketLabelsByOrderId[order.id]}
                  onStatusChange={(status) => updateStatus(order, status)}
                />
              ))}
              {!loading && completedOrders.length === 0 && <EmptyState>No completed orders yet.</EmptyState>}
            </div>
          </DashboardColumn>
        </section>
        {!showCompletedMobile && completedOrders.length > 0 && (
          <button
            className="mt-4 min-h-11 w-full rounded-2xl border border-brand-chrome bg-[#fffaf2]/90 px-4 text-sm font-black text-brand-ink"
            type="button"
            onClick={() => setShowCompletedMobile(true)}
          >
            Show completed orders ({completedOrders.length})
          </button>
        )}
      </main>
    </BartenderShell>
  );
}

function SectionQuickNav({
  counts,
  onCompletedClick,
}: {
  counts: { newOrders: number; inProgress: number; ready: number; completed: number };
  onCompletedClick: () => void;
}) {
  const items = [
    { label: "New", count: counts.newOrders, href: "#new-orders" },
    { label: "Making", count: counts.inProgress, href: "#in-progress-orders" },
    { label: "Ready", count: counts.ready, href: "#ready-orders" },
    { label: "Done", count: counts.completed, href: "#completed-orders", onClick: onCompletedClick },
  ];

  return (
    <nav className="sticky top-0 z-30 mb-2 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#15130f]/95 p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.28)] backdrop-blur sm:mb-4 sm:gap-2 sm:p-2">
      {items.map((item) => (
        <a
          key={item.href}
          className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-[#fffaf2]/92 px-2 text-xs font-black text-brand-ink shadow-sm sm:min-h-11 sm:text-sm"
          href={item.href}
          onClick={item.onClick}
        >
          <span>{item.label}</span>
          <span className="rounded-full bg-brand-ink px-1.5 py-0.5 text-[10px] leading-none text-white sm:text-xs">{item.count}</span>
        </a>
      ))}
    </nav>
  );
}

function DashboardColumn({
  id,
  title,
  count,
  tone = "default",
  className = "",
  children,
}: {
  id: string;
  title: string;
  count: number;
  tone?: "default" | "progress" | "ready" | "completed";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 min-w-0 rounded-2xl border border-white/10 bg-black/18 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${className}`}>
      <BoardHeader title={title} count={count} tone={tone} />
      {children}
    </section>
  );
}

function BoardHeader({ title, count, tone = "default" }: { title: string; count: number; tone?: "default" | "progress" | "ready" | "completed" }) {
  const toneClasses = {
    default: "border-brand-chrome bg-[#fffaf2]/90 text-brand-ink/65",
    progress: "border-[#d6bd7b]/40 bg-[#f5edda] text-[#715d2b]",
    ready: "border-brand-sea/25 bg-brand-sea/10 text-brand-sea",
    completed: "border-brand-chrome bg-[#eee6da] text-brand-ink/45",
  };

  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className={`font-heading text-xl font-black uppercase tracking-wide ${tone === "ready" ? "text-brand-sea" : "text-[#fffaf2]"}`}>
        {title}
      </h2>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${toneClasses[tone]}`}>
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
  ticketLabel,
  onStatusChange,
}: {
  order: BartenderOrder;
  disabled: boolean;
  loading: boolean;
  smsMessage?: string;
  ticketLabel?: string;
  onStatusChange: (status: NormalizedOrderStatus) => void;
}) {
  const style = getStatusCardStyle(order.status);
  const actions = getOrderActions(order);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const isCompactCard = normalizedStatus === "ready" || normalizedStatus === "completed";

  const code = shortOrderId(order.id);
  const guestName = getDisplayName(order.name);
  const anonymous = !order.name?.trim() || /^walk-?up( guest)?$/i.test(guestName.trim());
  const lines = (order.drink || "").split(/,\s*/).filter(Boolean);
  const waiting = normalizedStatus === "new" || normalizedStatus === "in_progress";
  const minutes = order.created_at ? Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)) : null;
  const ageTone = !waiting || minutes === null ? "bg-black/5 text-brand-ink/55"
    : minutes >= 10 ? "bg-rose-700 text-white" : minutes >= 5 ? "bg-amber-400 text-brand-ink" : "bg-black/5 text-brand-ink/70";
  const [primary, ...secondary] = [...actions].reverse();

  return (
    <article className={`flex flex-col overflow-hidden rounded-xl border shadow-sm ${style.card}`}>
      <div className={`h-2 ${style.bar}`} />
      <div className={`flex flex-1 flex-col ${isCompactCard ? "p-3" : "p-4"}`}>
        {/* The code is what the guest was told and wrote on the cup: make it the headline. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-3xl font-black leading-none tracking-wider text-brand-ink">#{code}</p>
            {!anonymous && <p className="mt-1 truncate text-lg font-black text-brand-ink/75" title={order.name}>{guestName}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-black tabular-nums ${ageTone}`} title={order.created_at ? formatOrderTime(order.created_at) : undefined}>
            {minutes === null ? "—" : minutes < 1 ? "now" : `${minutes} min`}
          </span>
        </div>
        {(isWalkupOrder(order) || order.handoff || order.table_number) && (
          <p className="mt-2 w-fit rounded-md bg-brand-rust px-2 py-0.5 text-xs font-black uppercase tracking-wide text-white">
            {isWalkupOrder(order) ? (order.square_order_id?.startsWith("cash:") ? "Walk-up · cash" : "Walk-up · card") : order.handoff ? HANDOFF_LABELS[order.handoff] : "Table " + order.table_number}
          </p>
        )}
        <ul className={`mt-2 grid gap-0.5 ${normalizedStatus === "completed" ? "text-base" : "text-xl"} font-black leading-snug text-brand-ink`}>
          {lines.map((line, index) => {
            const match = line.match(/^(\d+)\s*[×x]\s*(.+)$/);
            return <li key={index} className="flex gap-2">
              <span className={`w-8 shrink-0 text-right ${match && Number(match[1]) > 1 ? "text-brand-rust" : "text-brand-ink/45"}`}>{match ? match[1] + "×" : ""}</span>
              <span className="min-w-0">{match ? match[2] : line}</span>
            </li>;
          })}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-brand-ink/55">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <StatusBadge status={order.status} />}
          {order.bar_station && <span>{getStationLabel(order.bar_station)}</span>}
          {normalizedStatus === "ready" && <span className="text-brand-sea">Ready {formatReadyAge(order)}</span>}
          {order.phone.trim() && <span>{formatOrderPhone(order.phone)}</span>}
          {ticketLabel && <span className={ticketLabel.startsWith("NEEDS PAYMENT") ? "rounded-full border border-brand-sea/25 bg-brand-sea/10 px-2 py-0.5 text-brand-sea" : ""}>{ticketLabel}</span>}
        </div>

        {primary && (
          <div className="mt-auto grid gap-2 pt-3">
            <ActionButton label={primary.label} tone={primary.tone} disabled={disabled || order.status === primary.status}
              onClick={() => onStatusChange(primary.status)} />
            {secondary.map((action) => (
              <button key={action.status} type="button" disabled={disabled}
                className="min-h-11 rounded-xl border border-brand-chrome text-sm font-black text-brand-ink/70 disabled:opacity-40"
                onClick={() => onStatusChange(action.status)}>{action.label}</button>
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

function isWalkupOrder(order: BartenderOrder) {
  return /^(walkup|cash):/.test(order.square_order_id ?? "");
}

function getOrderActions(order: BartenderOrder): Array<{ label: string; status: NormalizedOrderStatus; tone: "default" | "ready" | "complete" }> {
  const normalizedStatus = normalizeOrderStatus(order.status);
  const readyLabel = isWalkupOrder(order) ? "Made" : order.handoff === "upstairs" ? "Send upstairs" : order.handoff ? "Made · to pickup table" : "Ready";
  if (normalizedStatus === "new") {
    return [
      { label: "Start", status: "in_progress", tone: "default" },
      { label: readyLabel, status: "ready", tone: "ready" },
    ];
  }

  if (normalizedStatus === "in_progress") {
    return [{ label: readyLabel, status: "ready", tone: "ready" }];
  }

  if (normalizedStatus === "ready") {
    return [{ label: isWalkupOrder(order) ? "Handed to guest" : order.handoff === "upstairs" ? "Mark delivered" : "Picked up · wristband checked", status: "completed", tone: "complete" }];
  }

  return [];
}

function BartenderShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2b2924_0%,_#171511_58%,_#0d0c0a_100%)] text-brand-ink">
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
        <GlassWater className="h-5 w-5" />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const normalizedStatus = normalizeOrderStatus(status);
  const labels: Record<NormalizedOrderStatus, string> = {
    new: "New",
    in_progress: "In Progress",
    ready: "Ready",
    completed: "Completed",
  };
  const classes: Record<NormalizedOrderStatus, string> = {
    new: "border border-brand-chrome bg-[#fffaf2] text-brand-ink/70",
    in_progress: "border border-[#d6bd7b]/40 bg-[#f5edda] text-[#715d2b]",
    ready: "border border-brand-sea/25 bg-brand-sea/10 text-brand-sea",
    completed: "border border-brand-chrome bg-[#eee6da] text-brand-ink/35",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${classes[normalizedStatus]}`}>{labels[normalizedStatus]}</span>;
}

function getStatusCardStyle(status: OrderStatus) {
  const normalizedStatus = normalizeOrderStatus(status);
  const styles: Record<NormalizedOrderStatus, { card: string; bar: string }> = {
    new: {
      card: "border-brand-chrome bg-[#fffaf2]/94 shadow-[0_14px_36px_rgba(46,46,46,0.08)]",
      bar: "bg-brand-ink",
    },
    in_progress: {
      card: "border-[#d8c48b]/60 bg-[#fff7e6]/94 shadow-[0_14px_36px_rgba(46,46,46,0.08)]",
      bar: "bg-[#b49a54]",
    },
    ready: {
      card: "border-brand-sea/25 bg-[#f4fbf7]/94 shadow-[0_12px_30px_rgba(46,46,46,0.07)]",
      bar: "bg-brand-sea",
    },
    completed: {
      card: "border-brand-chrome bg-[#eee6da]/80 opacity-55",
      bar: "bg-brand-chrome",
    },
  };

  return styles[normalizedStatus];
}

function staffFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("X-Walkup-Request", "1");
  if (staffCodeForNextRequest) headers.set("X-Walkup-Code", staffCodeForNextRequest);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers, credentials: "same-origin", cache: "no-store" });
}

async function loadOrders({
  setOrders,
  setLoading,
  setError,
  silent = false,
  onLocked,
}: {
  setOrders: (orders: BartenderOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  silent?: boolean;
  onLocked: () => void;
}) {
  if (!silent) setLoading(true);
  try {
    const response = await staffFetch(ORDERS_API);
    if (response.status === 401) {
      onLocked();
      return;
    }
    const payload = await response.json().catch(() => ({})) as { orders?: BartenderOrder[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "The order queue is unavailable.");
    setError("");
    setOrders(payload.orders ?? []);
  } catch (error) {
    // Keep showing the last good list during a brief connection drop.
    setError(error instanceof Error ? error.message : "The order queue is unavailable.");
  } finally {
    if (!silent) setLoading(false);
  }
}

async function loadDrinkMenu({ setDrinkMenu }: { setDrinkMenu: (drinks: DrinkMenuItem[]) => void }) {
  if (!orderSupabase) {
    setDrinkMenu(EVENT_DRINK_MENU);
    return;
  }
  try {
    const { data, error } = await orderSupabase.from("drinks").select("name, category");
    setDrinkMenu(error ? EVENT_DRINK_MENU : [...EVENT_DRINK_MENU, ...((data || []) as DrinkMenuItem[])]);
  } catch {
    setDrinkMenu(EVENT_DRINK_MENU);
  }
}

async function updateOrderStatus(id: string, status: NormalizedOrderStatus, barStation?: BarStation | null) {
  try {
    const response = await staffFetch(ORDERS_API, { method: "POST", body: JSON.stringify({ id, status, barStation }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    return { error: response.ok ? null : new Error(payload.error || "Status could not be saved.") };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

async function sendReadySms(order: BartenderOrder) {
  try {
    const response = await fetch("/api/send-ready-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Walkup-Request": "1" },
      credentials: "same-origin",
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

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStationLabel(station?: BarStation | null) {
  if (station === "white_bar") return "White Bar";
  if (station === "brown_bar") return "Brown Bar";
  return "";
}

function getDisplayName(value: string) {
  const firstName = value.trim().split(/\s+/)[0] || value.trim();
  return firstName.length > 18 ? `${firstName.slice(0, 18)}...` : firstName;
}

function getOrderTime(order: BartenderOrder) {
  if (!order.created_at) return Number.MAX_SAFE_INTEGER;
  const time = new Date(order.created_at).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function formatReadyAge(order: BartenderOrder) {
  const readyTime = getReadyTime(order);
  if (readyTime === Number.MAX_SAFE_INTEGER) return "just now";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - readyTime) / 60000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes === 1) return "1 min ago";
  return `${elapsedMinutes} mins ago`;
}

function getReadyTime(order: BartenderOrder) {
  const readyishTime = order.ready_sms_sent_at || order.updated_at || order.created_at;
  if (!readyishTime) return Number.MAX_SAFE_INTEGER;
  const time = new Date(readyishTime).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function playNewOrderDing() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.28);
  } catch (error) {
    console.warn("[New order sound unavailable]", error);
  }
}

function getTicketLabelsByOrderId(orders: BartenderOrder[], drinkMenu: DrinkMenuItem[]) {
  const ordersByPhone = new Map<string, BartenderOrder[]>();
  const drinkCategoriesByName = new Map(drinkMenu.map((drink) => [drink.name.toLowerCase(), drink.category || ""]));

  for (const order of orders) {
    if (!isTicketCountedStatus(order.status)) continue;
    const phoneKey = order.phone.trim();
    if (!phoneKey) continue;
    ordersByPhone.set(phoneKey, [...(ordersByPhone.get(phoneKey) || []), order]);
  }

  const labels: Record<string, string> = {};

  for (const phoneOrders of ordersByPhone.values()) {
    phoneOrders
      .sort((a, b) => getOrderTime(a) - getOrderTime(b))
      .forEach((order, index) => {
        if (index < MAX_DRINK_TICKETS) {
          labels[order.id] = `FREE ${index + 1}/${MAX_DRINK_TICKETS}`;
          return;
        }

        labels[order.id] = `NEEDS PAYMENT $${getPaidDrinkPrice(drinkCategoriesByName.get(order.drink.toLowerCase()) || "")}`;
      });
  }

  return labels;
}

function isTicketCountedStatus(status: string) {
  return ["new", "in_progress", "ready", "completed", "New", "In Progress", "Ready", "Completed"].includes(status);
}

function toPersistedOrderStatus(status: NormalizedOrderStatus): OrderStatus {
  const labels: Record<NormalizedOrderStatus, OrderStatus> = {
    new: "New",
    in_progress: "In Progress",
    ready: "Ready",
    completed: "Completed",
  };
  return labels[status];
}

function normalizeOrderStatus(status: string): NormalizedOrderStatus {
  if (status === "New") return "new";
  if (status === "In Progress") return "in_progress";
  if (status === "Ready") return "ready";
  if (status === "Completed") return "completed";
  if (status === "new" || status === "in_progress" || status === "ready" || status === "completed") return status;
  return "new";
}

function formatOrderPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (national.length !== 10) return value;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

function getPaidDrinkPrice(category: string) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("beer")) return 3;
  if (normalizedCategory.includes("wine")) return 4;
  return 5;
}

// Guest-facing pickup screen for the door table: /bartender?view=ready
// Uses the same staff session as the board, so unlock /bartender on that device first.
function ReadyBoard() {
  const [orders, setOrders] = useState<BartenderOrder[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "locked" | "offline">("loading");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const response = await staffFetch(ORDERS_API);
        if (ignore) return;
        if (response.status === 401) return setState("locked");
        const payload = await response.json() as { orders?: BartenderOrder[] };
        setOrders(payload.orders ?? []);
        setState("ok");
      } catch {
        if (!ignore) setState("offline");
      }
    };
    void load();
    const id = window.setInterval(load, BARTENDER_POLL_INTERVAL_MS);
    return () => { ignore = true; window.clearInterval(id); };
  }, []);

  const ready = orders.filter((order) => normalizeOrderStatus(order.status) === "ready").sort((a, b) => getReadyTime(a) - getReadyTime(b));
  const making = orders.filter((order) => ["new", "in_progress"].includes(normalizeOrderStatus(order.status))).length;

  return (
    <main className="min-h-screen bg-brand-ink p-6 text-white">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-heading text-4xl font-black">Ready for pickup</h1>
        <p className="text-xl font-bold text-white/70">{making} being made</p>
      </div>
      <p className="mt-1 text-lg text-white/70">Show your order number and wristband.</p>
      {state === "locked" && <p className="mt-6 rounded-xl bg-rose-900 p-4 text-xl font-bold">Unlock the bartender page on this device first, then reopen this screen.</p>}
      {state === "offline" && <p className="mt-6 rounded-xl bg-amber-800 p-4 text-xl font-bold">Reconnecting…</p>}
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ready.map((order) => (
          <li key={order.id} className="rounded-2xl bg-white p-4 text-center text-brand-ink">
            <p className="whitespace-nowrap text-[clamp(1.75rem,4.5vw,3rem)] font-black tracking-wide">#{shortOrderId(order.id)}</p>
            <p className="mt-1 truncate text-2xl font-bold">{getDisplayName(order.name).split(" ")[0]}</p>
          </li>
        ))}
      </ul>
      {state === "ok" && !ready.length && <p className="mt-10 text-center text-2xl text-white/60">Nothing waiting. Codes appear here when your order is ready.</p>}
    </main>
  );
}
