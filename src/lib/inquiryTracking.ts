import { track } from "@vercel/analytics";

export type InquiryEvent =
  | "quote_cta_click"
  | "quote_started"
  | "inquiry_contact_opened"
  | "inquiry_submit_attempt"
  | "inquiry_submitted"
  | "inquiry_submit_failed"
  | "phone_click"
  | "email_click";

// Deliberately accept only fixed names, not contact details, form values or URLs.
export function trackInquiryEvent(event: InquiryEvent) {
  try { track(event); } catch { /* Analytics must never block an inquiry. */ }
}

export function createInquiryTracker(send: (event: InquiryEvent) => void = trackInquiryEvent) {
  const seen = new Set<InquiryEvent>();
  const emit = (event: InquiryEvent) => {
    try { send(event); } catch { /* Keep booking functional if analytics fails. */ }
  };
  const once = (event: InquiryEvent) => {
    if (seen.has(event)) return;
    seen.add(event);
    emit(event);
  };
  return {
    started: () => once("quote_started"),
    contactOpened: () => once("inquiry_contact_opened"),
    attempted: () => emit("inquiry_submit_attempt"),
    accepted: () => once("inquiry_submitted"),
    failed: () => emit("inquiry_submit_failed"),
    reset: () => seen.clear(),
  };
}

export function trackInquiryLinkClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest("a") : null;
  if (!target) return;
  const href = target.getAttribute("href") ?? "";
  if (href.startsWith("tel:")) trackInquiryEvent("phone_click");
  else if (href.startsWith("mailto:")) trackInquiryEvent("email_click");
  else {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === "/" && url.hash === "#book") {
        trackInquiryEvent("quote_cta_click");
      }
    } catch { /* Ignore malformed links without changing normal navigation. */ }
  }
}
