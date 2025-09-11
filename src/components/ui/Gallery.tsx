import * as React from "react";

/** Minimal shape; only `src` and `alt` are required. */
export type GalleryItem = {
  alt: string;
  /** Can be "gallery/beer-pour-800.jpg" or "/gallery/beer-pour-800.jpg" */
  src: string;

  /** Optional responsive sets; same rule as `src` (relative is fine). */
  srcSet?: string;     // e.g. "gallery/x-400.jpg 400w, gallery/x-800.jpg 800w"
  webp?: string;       // single webp
  webpSet?: string;    // "gallery/x-400.webp 400w, gallery/x-800.webp 800w"
};

interface Props {
  items: GalleryItem[];
}

const BASE = import.meta.env.BASE_URL;

/** Prefix project base to relative paths and to leading-slash paths. */
function withBase(p?: string) {
  if (!p) return undefined;
  if (/^(https?:)?\/\//.test(p) || p.startsWith("data:")) return p; // absolute
  if (p.startsWith("/")) return BASE + p.slice(1);                   // "/gallery/..." -> "/rikki-mobile-bar/gallery/..."
  return BASE + p;                                                   // "gallery/..."  -> "/rikki-mobile-bar/gallery/..."
}

/** Apply withBase() to every URL inside a srcset string. */
function withBaseSet(s?: string) {
  if (!s) return undefined;
  return s
    .split(",")
    .map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [withBase(url), ...rest].join(" ");
    })
    .join(", ");
}

export default function Gallery({ items }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it, i) => (
        <figure
          key={i}
          className="aspect-[4/3] overflow-hidden rounded-2xl border border-brand-chrome bg-brand-ink/5"
        >
          <picture>
            {it.webpSet && <source type="image/webp" srcSet={withBaseSet(it.webpSet)} />}
            {it.webp && <source type="image/webp" srcSet={withBase(it.webp)} />}
            {it.srcSet && <source type="image/jpeg" srcSet={withBaseSet(it.srcSet)} />}
            <img
              loading="lazy"
              decoding="async"
              alt={it.alt}
              src={withBase(it.src)}
              srcSet={withBaseSet(it.srcSet)}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              onError={(e) => {
                // graceful fallback if a path is wrong
                e.currentTarget.style.opacity = "0.25";
              }}
            />
          </picture>
          <figcaption className="sr-only">{it.alt}</figcaption>
        </figure>
      ))}
    </div>
  );
}
