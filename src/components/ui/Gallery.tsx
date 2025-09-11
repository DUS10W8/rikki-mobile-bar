import * as React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryItem = {
  id: string;
  alt: string;
  preview: string;         // grid thumbnail (e.g., 800px jpg)
  full?: string;           // fallback full-size src
  webpSet?: string;        // "/img-800.webp 800w, /img-1200.webp 1200w, /img-1600.webp 1600w"
  jpgSet?: string;         // "/img-800.jpg 800w, /img-1200.jpg 1200w, /img-1600.jpg 1600w"
  sizes?: string;          // "(min-width:1024px) 80vw, 100vw"
  width?: number;          // intrinsic width for lightbox <img>
  height?: number;         // intrinsic height for lightbox <img>
};

export interface GalleryProps {
  items: GalleryItem[];
  className?: string;
}

export default function Gallery({ items, className }: GalleryProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  // Lock page scroll & focus the close button when open
  React.useEffect(() => {
    const root = document.documentElement;
    if (openIndex !== null) {
      root.classList.add("overflow-hidden");
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      root.classList.remove("overflow-hidden");
    }
    return () => root.classList.remove("overflow-hidden");
  }, [openIndex]);

  // Keyboard navigation
  React.useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? i : Math.min(items.length - 1, i + 1)));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, items.length]);

  return (
    <div className={className}>
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-brand-chrome bg-brand-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/50"
            onClick={() => setOpenIndex(i)}
          >
            <img
              src={it.preview}
              alt={it.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="absolute inset-0 m-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              ref={closeBtnRef}
              onClick={() => setOpenIndex(null)}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            <button
              onClick={() => setOpenIndex(Math.max(0, openIndex - 1))}
              disabled={openIndex <= 0}
              className="absolute left-2 md:left-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next */}
            <button
              onClick={() => setOpenIndex(Math.min(items.length - 1, openIndex + 1))}
              disabled={openIndex >= items.length - 1}
              className="absolute right-2 md:right-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="max-h-[85vh] max-w-[92vw] md:max-w-[80vw]">
              {(() => {
                const it = items[openIndex];
                const sizes = it.sizes || "(min-width:1024px) 80vw, 100vw";
                const full = it.full || it.preview;
                return (
                  <picture>
                    {it.webpSet && <source type="image/webp" srcSet={it.webpSet} sizes={sizes} />}
                    {it.jpgSet && <source type="image/jpeg" srcSet={it.jpgSet} sizes={sizes} />}
                    <img
                      src={full}
                      alt={it.alt}
                      width={it.width}
                      height={it.height}
                      loading="eager"
                      decoding="async"
                      className="h-auto w-full rounded-xl border border-brand-chrome bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                    />
                  </picture>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}