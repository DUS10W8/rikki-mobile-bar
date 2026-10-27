// Records every quote request in the command-center database (Supabase).
//
// The browser generates one submission_id per estimate and sends the same id to
// Formspree, so the two systems can be reconciled record-by-record. The call is
// idempotent: retries with the same id never create a second quote or lead.
// It is sent BEFORE the Formspree post, so a quote that reached Formspree can never
// be missing here (the reverse case shows up as an unconfirmed submission).

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(request, response) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method !== "POST") return sendJson(response, 405, { ok: false, message: "Method not allowed." });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !anonKey) {
    return sendJson(response, 500, { ok: false, message: "Quote intake is not configured." });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  } catch {
    return sendJson(response, 400, { ok: false, message: "Invalid JSON." });
  }

  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const submissionId = String(body.submissionId || payload.submission_id || "");
  if (!UUID_RE.test(submissionId)) return sendJson(response, 400, { ok: false, message: "Missing submission id." });
  if (!String(payload.name || "").trim()) return sendJson(response, 400, { ok: false, message: "Missing name." });

  const attribution = sanitizeAttribution(body.attribution);
  const row = toSubmissionRow(submissionId, payload, attribution);

  try {
    // record_quote is an insert-only, idempotent database function (see
    // supabase/migrations/20261026b_record_quote_rpc.sql); the anon key can call
    // it but cannot read any table.
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/record_quote`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_row: row, p_source: deriveSource(attribution) }),
    });
    if (!res.ok) throw new Error(`record_quote ${res.status}: ${await res.text()}`);
    const leadId = await res.json();
    return sendJson(response, 200, { ok: true, submissionId, leadId });
  } catch (error) {
    console.error("[quote-intake]", error);
    return sendJson(response, 502, { ok: false, message: "Could not record quote." });
  }
}

export function toSubmissionRow(submissionId, p, attribution) {
  const range = parseRange(p.estimated_range);
  const guests = Number.parseInt(p.guestCountEstimate, 10);
  return {
    submission_id: submissionId,
    origin: "site",
    name: str(p.name),
    email: str(p.email)?.toLowerCase() || null,
    phone: str(p.phone),
    event_date: /^\d{4}-\d{2}-\d{2}$/.test(p.eventDate || "") ? p.eventDate : null,
    event_type: str(p.eventType),
    service_type: str(p.serviceType),
    guest_count: Number.isFinite(guests) ? guests : null,
    duration: str(p.duration),
    bar_tier: str(p.barTier),
    bar_payment_model: str(p.barPaymentModel),
    estimate_min: range.min,
    estimate_max: range.max,
    promo_code: str(p.promoCode),
    attribution,
    payload: p,
  };
}

export function parseRange(text) {
  const nums = String(text || "").match(/[\d,]+(\.\d+)?/g)?.map((n) => Number(n.replace(/,/g, ""))) || [];
  return { min: nums[0] ?? null, max: nums[1] ?? nums[0] ?? null };
}

const SOURCE_RULES = [
  [/google\./, "google"],
  [/bing\.|duckduckgo|yahoo\./, "search_other"],
  [/instagram|l\.instagram/, "instagram"],
  [/facebook|fb\.com|m\.facebook/, "facebook"],
  [/theknot|weddingwire/, "the_knot"],
  [/tri-?cityherald|aol\.com/, "press"],
  [/tricityregionalchamber/, "chamber"],
];

export function deriveSource(attribution = {}) {
  const utm = String(attribution.utm_source || "").toLowerCase().trim();
  if (utm) return utm.replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "other";
  const ref = String(attribution.referrer || "").toLowerCase();
  if (!ref || ref.includes("rikkismobile.com")) return "direct";
  for (const [re, name] of SOURCE_RULES) if (re.test(ref)) return name;
  try {
    return new URL(ref).hostname.replace(/^www\./, "").slice(0, 40);
  } catch {
    return "other";
  }
}

function sanitizeAttribution(a) {
  if (!a || typeof a !== "object") return {};
  const keep = ["referrer", "landing_page", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "first_seen_at"];
  const out = {};
  for (const k of keep) if (a[k] != null) out[k] = String(a[k]).slice(0, 500);
  return out;
}

function str(v) {
  const s = v == null ? "" : String(v).trim();
  return s ? s.slice(0, 2000) : null;
}

function sendJson(response, status, payload) {
  for (const [key, value] of Object.entries(jsonHeaders)) response.setHeader(key, value);
  return status === 204 ? response.status(204).end() : response.status(status).json(payload);
}
