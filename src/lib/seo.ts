import { createContext, useContext, useEffect } from "react";

export type SeoMeta = {
  title: string;
  description: string;
  /** Absolute canonical URL, e.g. https://www.rikkismobile.com/wedding-bartender-tri-cities-wa/ */
  canonical: string;
  /** Absolute OG image URL */
  ogImage?: string;
  /** JSON-LD objects to inject as <script type="application/ld+json"> */
  schema?: Array<Record<string, unknown>>;
  /** Set to noindex for operational/internal tools */
  noindex?: boolean;
};

const DEFAULT_OG_IMAGE = "https://www.rikkismobile.com/epic-negative-r.png";
export const SeoCollector = createContext<((meta: SeoMeta) => void) | null>(null);

function setMeta(nameOrProp: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${nameOrProp}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(nameOrProp, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Client-side head manager for statically-rendered marketing routes.
 * The build (scripts/create-spa-routes.mjs) already bakes the correct
 * title/description/canonical/OG/JSON-LD into the pre-rendered HTML for
 * crawlers; this hook keeps the DOM in sync for client-side state (and
 * covers local `npm run dev`, where the pre-render step doesn't run).
 */
export function useDocumentHead(meta: SeoMeta) {
  const collect = useContext(SeoCollector);
  collect?.(meta);
  useEffect(() => {
    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:url", meta.canonical);
    setMeta("property", "og:image", meta.ogImage ?? DEFAULT_OG_IMAGE);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", meta.ogImage ?? DEFAULT_OG_IMAGE);
    setMeta("name", "robots", meta.noindex ? "noindex,follow" : "index,follow");

    let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", meta.canonical);

    // Remove any previously-injected schema from a prior page (defensive; routes
    // in this app are full page loads, so this normally runs once per document).
    document.querySelectorAll('script[data-seo-schema="1"]').forEach((n) => n.remove());

    (meta.schema ?? []).forEach((obj) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoSchema = "1";
      script.textContent = JSON.stringify(obj);
      document.head.appendChild(script);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.description, meta.canonical]);
}

export const SITE_URL = "https://www.rikkismobile.com";
export const BUSINESS = {
  name: "Rikki's Mobile Bar",
  telephone: "+1-509-231-9354",
  telephoneDisplay: "(509) 231-9354",
  email: "rikki@rikkismobile.com",
  instagram: "https://instagram.com/rikkismobile",
  facebook: "https://www.facebook.com/people/Rikkis-Mobile/61584650340060/",
  googleProfile: "https://g.page/r/CWNxLHvZMBo5EBM",
  googleReview: "https://g.page/r/CWNxLHvZMBo5EBM/review",
};
