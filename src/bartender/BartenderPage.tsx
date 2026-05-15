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
import { orderSupabase, orderSupabaseConfig } from "../order/orderSupabaseClient";

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
  created_at?: string;
  updated_at?: string;
  ready_sms_sent_at?: string | null;
};

type DrinkMenuItem = {
  name: string;
  category: string | null;
};

const BARTENDER_PIN = import.meta.env.VITE_BARTENDER_PIN?.trim() || "";
const PIN_SESSION_KEY = "rikki-bartender-pin-ok";
const STATION_STORAGE_KEY = "rikki-bartender-station";
const MAX_DRINK_TICKETS = 2;

export default function BartenderPage() {
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem(PIN_SESSION_KEY) === "true");
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
    if (!authorized) return undefined;

    const refreshOrders = (silent = false) => loadOrders({ setOrders, setLoading, setError, silent });

    refreshOrders();
    loadDrinkMenu({ setDrinkMenu });
    const pollId = window.setInterval(() => refreshOrders(true), BARTENDER_POLL_INTERVAL_MS);

    if (!orderSupabase) {
      return () => window.clearInterval(pollId);
    }

    const channel = orderSupabase
      .channel("bartender-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        refreshOrders(true);
      })
      .subscribe();

    return () => {
      window.clearInterval(pollId);
      orderSupabase.removeChannel(channel);
    };
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
          ? { ...item, status, bar_station: nextStation === undefined ? item.bar_station : nextStation, updated_at: new Date().toISOString() }
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

  if (!station) {
    return (
      <BartenderShell>
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
          <section className="rounded-2xl border border-brand-chrome bg-[#fffaf2]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <p className="text-sm font-black uppercase tracking-wide text-brand-sea">Rikki's Mobile Bar</p>
            <h1 className="mt-1 font-heading text-3xl font-black text-brand-ink">Choose station</h1>
            <p className="mt-2 text-sm font-semibold text-brand-ink/65">Orders you start will be assigned to this bar for customer pickup.</p>
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
                <button className="rounded-full border border-brand-chrome bg-[#fffaf2]/90 px-3 py-1 text-xs font-black text-brand-ink" type="button" onClick={changeStation}>
                  Change station
                </button>
              </div>
            </div>
          </div>
          <button
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-chrome bg-[#fffaf2]/90 px-3 text-sm font-bold text-brand-ink shadow-sm sm:min-h-11 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-base"
            onClick={() => loadOrders({ setOrders, setLoading, setError })}
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

        <QueueSummary activeQueueCount={activeQueueCount} readyCount={readyOrders.length} />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

          <DashboardColumn id="ready-orders" title="Ready for Pickup" count={readyOrders.length} tone="ready">
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
              {!loading && readyOrders.length === 0 && <EmptyState>No drinks ready for pickup.</EmptyState>}
            </div>
          </DashboardColumn>

          <DashboardColumn
            id="completed-orders"
            title="Completed"
            count={completedOrders.length}
            tone="completed"
            className={showCompletedMobile ? "" : "hidden md:block"}
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
            className="mt-4 min-h-11 w-full rounded-2xl border border-brand-chrome bg-[#fffaf2]/90 px-4 text-sm font-black text-brand-ink md:hidden"
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

function QueueSummary({ activeQueueCount, readyCount }: { activeQueueCount: number; readyCount: number }) {
  return (
    <section className="mb-3 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
      <div className="rounded-xl border border-brand-chrome/35 bg-[#fffaf2]/95 px-2 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.22)] sm:rounded-2xl sm:px-5 sm:py-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-brand-ink/50 sm:text-xs">Queue</p>
        <p className="mt-0.5 text-lg font-black text-brand-ink sm:mt-1 sm:text-3xl"><span className="sm:hidden">{activeQueueCount}</span><span className="hidden sm:inline">{activeQueueCount} Drinks In Queue</span></p>
      </div>
      <div className="rounded-xl border border-[#d6bd7b]/45 bg-[#fff7e6]/95 px-2 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:rounded-2xl sm:px-5 sm:py-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-brand-ink/50 sm:text-xs">Wait</p>
        <p className="mt-0.5 text-lg font-black text-brand-ink sm:mt-1 sm:text-3xl">~{activeQueueCount}<span className="sm:hidden"> min</span><span className="hidden sm:inline"> Minute Wait</span></p>
      </div>
      <div className="rounded-xl border border-brand-sea/30 bg-[#f4fbf7]/95 px-2 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:rounded-2xl sm:px-5 sm:py-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-brand-ink/50 sm:text-xs">Ready</p>
        <p className="mt-0.5 text-lg font-black text-brand-sea sm:mt-1 sm:text-3xl">{readyCount}<span className="hidden sm:inline"> Ready</span></p>
      </div>
    </section>
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
  const actions = getOrderActions(order.status);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const isCompactCard = normalizedStatus === "ready" || normalizedStatus === "completed";

  return (
    <article className={`flex flex-col overflow-hidden rounded-xl border shadow-sm ${isCompactCard ? "" : "min-h-[330px]"} ${style.card}`}>
      <div className={`h-2.5 ${style.bar}`} />
      <div className={`flex flex-1 flex-col ${isCompactCard ? "p-3" : "p-4"}`}>
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 truncate font-heading text-3xl font-black leading-tight text-brand-ink" title={order.name}>{getDisplayName(order.name)}</h2>
            <span className="shrink-0 pt-1 text-xs font-black text-brand-ink/45">{order.created_at ? formatOrderTime(order.created_at) : "No time"}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-xl font-black leading-snug text-brand-ink/78">{order.drink}</p>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-ink/55" /> : <StatusBadge status={order.status} />}
          </div>
          <p className="text-sm font-black text-brand-ink/62">{getStationStatusLabel(order)}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-brand-ink/50">
            {order.phone.trim() && <span>{formatOrderPhone(order.phone)}</span>}
            {ticketLabel && <span
              className={
                ticketLabel.startsWith("NEEDS PAYMENT")
                  ? "rounded-full border border-brand-sea/25 bg-brand-sea/10 px-2 py-0.5 text-brand-sea"
                  : ""
              }
            >
              {ticketLabel}
            </span>}
          </div>
          {order.bar_station && <p className="rounded-lg bg-brand-ink px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-white">Claimed by {getStationLabel(order.bar_station)}</p>}
          {normalizedStatus === "ready" && <p className="rounded-lg bg-brand-sea/10 px-2.5 py-1.5 text-sm font-black text-brand-sea">Ready {formatReadyAge(order)}</p>}
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

function getOrderActions(status: OrderStatus): Array<{ label: string; status: NormalizedOrderStatus; tone: "default" | "ready" | "complete" }> {
  const normalizedStatus = normalizeOrderStatus(status);
  if (normalizedStatus === "new") {
    return [
      { label: "Start", status: "in_progress", tone: "default" },
      { label: "Ready", status: "ready", tone: "ready" },
    ];
  }

  if (normalizedStatus === "in_progress") {
    return [{ label: "Ready", status: "ready", tone: "ready" }];
  }

  if (normalizedStatus === "ready") {
    return [{ label: "Complete", status: "completed", tone: "complete" }];
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
  silent = false,
}: {
  setOrders: (orders: BartenderOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  silent?: boolean;
}) {
  if (!silent) setLoading(true);

  const configError = requireSupabase("orders.select");
  if (configError || !orderSupabase) {
    if (!silent) setLoading(false);
    setOrders([]);
    setError(configError?.message || "Supabase is not configured.");
    return;
  }

  const { data, error } = await orderSupabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(75);

  if (!silent) setLoading(false);

  if (error) {
    setOrders([]);
    setError(error.message);
    return;
  }

  setError("");
  setOrders((data || []) as BartenderOrder[]);
}

async function loadDrinkMenu({ setDrinkMenu }: { setDrinkMenu: (drinks: DrinkMenuItem[]) => void }) {
  const configError = requireSupabase("drinks.select");
  if (configError || !orderSupabase) {
    setDrinkMenu(EVENT_DRINK_MENU);
    return;
  }

  try {
    const { data, error } = await orderSupabase.from("drinks").select("name, category");
    setDrinkMenu(error ? EVENT_DRINK_MENU : [...EVENT_DRINK_MENU, ...((data || []) as DrinkMenuItem[])]);
  } catch (error) {
    console.error("[Supabase request failed]", {
      operation: "drinks.select",
      message: error instanceof Error ? error.message : String(error),
    });
    setDrinkMenu(EVENT_DRINK_MENU);
  }
}

async function updateOrderStatus(id: string, status: NormalizedOrderStatus, barStation?: BarStation | null) {
  const configError = requireSupabase("orders.update");
  if (configError || !orderSupabase) return { error: configError || new Error("Supabase is not configured.") };

  try {
    const update: { status: NormalizedOrderStatus; bar_station?: BarStation | null } = { status };
    if (barStation !== undefined) update.bar_station = barStation;

    const { error } = await orderSupabase.from("orders").update(update).eq("id", id);
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

function getStationLabel(station?: BarStation | null) {
  if (station === "white_bar") return "White Bar";
  if (station === "brown_bar") return "Brown Bar";
  return "";
}

function getStationStatusLabel(order: BartenderOrder) {
  const stationName = getStationLabel(order.bar_station);
  const normalizedStatus = normalizeOrderStatus(order.status);
  if (normalizedStatus === "in_progress" && stationName) return `Making at ${stationName}`;
  if (normalizedStatus === "ready" && stationName) return `Ready at ${stationName}`;
  if (normalizedStatus === "new") return "Waiting to be started";
  if (normalizedStatus === "completed" && stationName) return `Completed at ${stationName}`;
  return stationName ? `Station: ${stationName}` : "No station yet";
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
