import { createHmac, timingSafeEqual } from "node:crypto";

// One server-checked staff code (WALKUP_STAFF_CODE) unlocks the walk-up register, the
// bartender board and cash. A signed, HttpOnly cookie keeps the device unlocked for 12 hours.
const sessionName = "rikki_walkup";
const sessionSeconds = 12 * 60 * 60;

function safeEqual(value, expected) {
  if (typeof value !== "string" || typeof expected !== "string" || value.length > 128) return false;
  const supplied = Buffer.from(value.trim());
  const secret = Buffer.from(expected.trim());
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

function signature(expiry, secret) {
  return createHmac("sha256", secret.trim()).update("walkup:" + expiry).digest("hex");
}

export function staffCode() {
  const code = process.env.WALKUP_STAFF_CODE;
  return code && code.trim().length >= 16 ? code : null;
}

export const hasStaffAccess = safeEqual;

export function hasSession(cookieHeader, secret) {
  const value = cookieHeader?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(sessionName + "="));
  const [expiry, sig] = value?.slice(sessionName.length + 1).split(".") ?? [];
  if (!/^\d{10}$/.test(expiry ?? "") || Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, signature(expiry, secret));
}

export function setSession(res, secret, maxAge = sessionSeconds) {
  const expiry = Math.floor(Date.now() / 1000) + maxAge;
  const value = maxAge ? expiry + "." + signature(expiry, secret) : "";
  // Path=/api so the board, register and cash endpoints share one unlock.
  res.setHeader("Set-Cookie", sessionName + "=" + value + "; Path=/api; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax");
}

// Returns true when the request carries a valid code or session; refreshes the cookie on a valid code.
export function authorizeStaff(req, res) {
  const secret = staffCode();
  if (!secret) return false;
  if (safeEqual(req.headers["x-walkup-code"], secret)) {
    setSession(res, secret);
    return true;
  }
  return hasSession(req.headers.cookie, secret);
}

// Optional second code for money-out actions (refunds, payouts, drops, closing).
// If WALKUP_MANAGER_CODE is not set, staff access is enough and the actor name is recorded.
export function hasManagerAccess(req) {
  const manager = process.env.WALKUP_MANAGER_CODE;
  if (!manager || manager.trim().length < 8) return true;
  return safeEqual(req.headers["x-manager-code"], manager);
}
