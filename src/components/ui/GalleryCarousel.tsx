import * as React from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { galleryItems } from "../../data/gallery";

const BASE = import.meta.env.BASE_URL;

function withBase(p?: string) {
  if (!p) return undefined;
  if (/^(https?:)?\/\//.test(p) || p.startsWith("data:")) return p;
  if (p.startsWith("/")) return BASE + p.slice(1);
  return BASE + p;
}

function withBaseSet(srcset?: string) {
  if (!srcset) return undefined;
  return srcset
    .split(",")
    .map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [withBase(url), ...rest].join(" ");
    })
    .join(", ");
}

export default function GalleryCarousel() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const [inView, setInView] = React.useState(false);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const pausedUntil = React.useRef(0);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = React.useCallback((index: number, isAuto = false) => {
    const el = cardRefs.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    if (!isAuto) pausedUntil.current = Date.now() + 6000;
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive((cur) => {
        const next = (cur + 1) % galleryItems.length;
        goTo(next, true);
        return next;
      });
    }, 4200);
    return () => clearInterval(id);
  }, [inView, goTo]);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { root: track, threshold: [0.6] }
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Lightbox: lock scroll + focus + keyboard nav
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

  React.useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? i : Math.min(galleryItems.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerDown={() => (pausedUntil.current = Date.now() + 8000)}
      onMouseEnter={() => (pausedUntil.current = Math.max(pausedUntil.current, Date.now() + 1200))}
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-[7vw] sm:px-[calc(50%-220px)] py-4"
      >
        {galleryItems.map((item, i) => {
          const isActive = i === active;
          return (
            <div
              key={item.id}
              data-index={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`relative shrink-0 snap-center w-[82vw] max-w-[380px] sm:w-[420px] sm:max-w-none transition-all duration-500 ease-out ${
                isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-50"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`View larger: ${item.alt}`}
                className={`group relative block w-full aspect-[4/3] overflow-hidden rounded-[1.5rem] border bg-white text-left transition-shadow duration-500 ${
                  isActive
                    ? "border-brand-sea/60 shadow-[0_24px_60px_rgba(46,155,138,0.28)]"
                    : "border-brand-chrome shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
                }`}
              >
                <picture>
                  {item.webpSet && (
                    <source
                      type="image/webp"
                      srcSet={withBaseSet(item.webpSet)}
                      sizes="(min-width:640px) 420px, 82vw"
                    />
                  )}
                  <img
                    src={withBase(item.preview)}
                    srcSet={item.jpgSet ? withBaseSet(item.jpgSet) : undefined}
                    sizes="(min-width:640px) 420px, 82vw"
                    alt={item.alt}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </picture>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => goTo((active - 1 + galleryItems.length) % galleryItems.length)}
        aria-label="Previous photo"
        className="absolute left-0 sm:-left-2 top-[calc(50%-14px)] -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-brand-chrome shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform active:scale-90 hover:scale-105"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo((active + 1) % galleryItems.length)}
        aria-label="Next photo"
        className="absolute right-0 sm:-right-2 top-[calc(50%-14px)] -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-brand-chrome shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform active:scale-90 hover:scale-105"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="mt-2 flex items-center justify-center gap-2">
        {galleryItems.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-7 bg-brand-sea" : "w-2 bg-brand-chrome hover:bg-brand-ink/30"
            }`}
          />
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
            <button
              ref={closeBtnRef}
              onClick={() => setOpenIndex(null)}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setOpenIndex(Math.max(0, openIndex - 1))}
              disabled={openIndex <= 0}
              className="absolute left-2 md:left-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setOpenIndex(Math.min(galleryItems.length - 1, openIndex + 1))}
              disabled={openIndex >= galleryItems.length - 1}
              className="absolute right-2 md:right-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-brand-ink shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="max-h-[85vh] max-w-[92vw] md:max-w-[80vw]">
              {(() => {
                const item = galleryItems[openIndex];
                const full = withBase(item.full || item.preview);
                return (
                  <picture>
                    {item.webpSet && (
                      <source
                        type="image/webp"
                        srcSet={withBaseSet(item.webpSet)}
                        sizes="(min-width:1024px) 80vw, 100vw"
                      />
                    )}
                    {item.jpgSet && (
                      <source
                        type="image/jpeg"
                        srcSet={withBaseSet(item.jpgSet)}
                        sizes="(min-width:1024px) 80vw, 100vw"
                      />
                    )}
                    <img
                      src={full}
                      alt={item.alt}
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
