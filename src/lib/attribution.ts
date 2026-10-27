// First-touch attribution so the command center can report quote-to-booking
// conversion by source. Captured once per browser, never shown to the guest.

const KEY = "rmb_first_touch_v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | "referrer" | "landing_page" | "first_seen_at", string>>;

function current(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const out: Attribution = {
    referrer: document.referrer || "",
    landing_page: window.location.pathname,
    first_seen_at: new Date().toISOString(),
  };
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function captureAttribution(): void {
  try {
    const now = current();
    const stored = window.localStorage.getItem(KEY);
    const hasCampaign = UTM_KEYS.some((k) => now[k]);
    // Keep the first touch, unless a new campaign link brought them back.
    if (!stored || hasCampaign) window.localStorage.setItem(KEY, JSON.stringify(now));
  } catch {
    /* storage blocked: getAttribution() falls back to the current page */
  }
}

export function getAttribution(): Attribution {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch {
    /* fall through */
  }
  return current();
}

export function newSubmissionId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
