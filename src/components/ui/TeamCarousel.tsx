import * as React from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { team, type TeamMember } from "../../data/team";

const BASE = import.meta.env.BASE_URL;

type Slide =
  | { type: "member"; member: TeamMember }
  | { type: "cover"; slug: string; alt: string };

const slides: Slide[] = [
  { type: "cover", slug: "meet-the-team", alt: "Meet the Rikki's Mobile Bar team" },
  ...team.map((m) => ({ type: "member" as const, member: m })),
  { type: "cover", slug: "the-crew", alt: "The full Rikki's Mobile Bar crew at an event" },
];

const LIKES_KEY = "rikki-team-likes";

function loadLikes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLikes(likes: Record<string, number>) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  } catch {
    /* ignore */
  }
}

function slideSlug(slide: Slide) {
  return slide.type === "member" ? slide.member.slug : slide.slug;
}
function slideKey(slide: Slide) {
  return slide.type === "member" ? slide.member.id : slide.slug;
}

const PARTICLE_COLORS = ["#2E9B8A", "#B96B4D", "#F2C14E", "#ffffff"];

function Burst() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        const dist = 30 + Math.random() * 24;
        return {
          key: i,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          delay: Math.random() * 50,
        };
      }),
    []
  );
  return (
    <>
      {particles.map((p) => (
        <span
          key={p.key}
          className="particle"
          style={
            {
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              background: p.color,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export default function TeamCarousel() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = React.useState(1);
  const [inView, setInView] = React.useState(false);
  const [likes, setLikes] = React.useState<Record<string, number>>({});
  const [bursts, setBursts] = React.useState<Record<string, number>>({});
  const pausedUntil = React.useRef(0);

  React.useEffect(() => {
    setLikes(loadLikes());
  }, []);

  // Only run the show once the section is actually on screen
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

  // Autoplay while visible, paused briefly after any user interaction
  React.useEffect(() => {
    if (!inView) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive((cur) => {
        const next = (cur + 1) % slides.length;
        goTo(next, true);
        return next;
      });
    }, 4200);
    return () => clearInterval(id);
  }, [inView, goTo]);

  // Track which slide is centered as the user swipes/scrolls
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

  function handleLike(id: string) {
    setLikes((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      saveLikes(next);
      return next;
    });
    setBursts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    pausedUntil.current = Date.now() + 6000;
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerDown={() => (pausedUntil.current = Date.now() + 8000)}
      onMouseEnter={() => (pausedUntil.current = Math.max(pausedUntil.current, Date.now() + 1200))}
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-[9vw] sm:px-[calc(50%-190px)] py-6"
      >
        {slides.map((slide, i) => {
          const isActive = i === active;
          const slug = slideSlug(slide);
          const key = slideKey(slide);
          const alt =
            slide.type === "member"
              ? `${slide.member.name}, ${slide.member.role} at Rikki's Mobile Bar`
              : slide.alt;

          return (
            <div
              key={key}
              data-index={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`relative shrink-0 snap-center w-[76vw] max-w-[300px] sm:w-[340px] sm:max-w-none transition-all duration-500 ease-out ${
                isActive ? "scale-100 opacity-100" : "scale-[0.88] opacity-45"
              }`}
            >
              <div
                className={`group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border bg-white transition-shadow duration-500 ${
                  isActive
                    ? "border-brand-sea/60 shadow-[0_28px_70px_rgba(46,155,138,0.3)]"
                    : "border-brand-chrome shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                }`}
              >
                <picture>
                  <source
                    type="image/webp"
                    srcSet={`${BASE}team/${slug}-700.webp 700w, ${BASE}team/${slug}-1000.webp 1000w, ${BASE}team/${slug}-1400.webp 1400w`}
                    sizes="(min-width:640px) 340px, 76vw"
                  />
                  <img
                    src={`${BASE}team/${slug}-1000.jpg`}
                    srcSet={`${BASE}team/${slug}-700.jpg 700w, ${BASE}team/${slug}-1000.jpg 1000w, ${BASE}team/${slug}-1400.jpg 1400w`}
                    sizes="(min-width:640px) 340px, 76vw"
                    alt={alt}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>

                {slide.type === "member" && (
                  <button
                    type="button"
                    onClick={() => handleLike(slide.member.id)}
                    aria-label={`Send ${slide.member.name} a high five`}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-brand-ink shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform active:scale-90 hover:scale-105"
                  >
                    <span
                      key={bursts[slide.member.id] || 0}
                      className={`relative inline-flex h-4 w-4 items-center justify-center ${
                        bursts[slide.member.id] ? "like-pop" : ""
                      }`}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${
                          slide.member.accent === "sea" ? "text-brand-sea" : "text-brand-rust"
                        }`}
                        fill={likes[slide.member.id] ? "currentColor" : "none"}
                      />
                      {bursts[slide.member.id] ? <Burst /> : null}
                    </span>
                    {likes[slide.member.id] || 0}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => goTo((active - 1 + slides.length) % slides.length)}
        aria-label="Previous team member"
        className="absolute left-0 sm:-left-2 top-[calc(50%-14px)] -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-brand-chrome shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform active:scale-90 hover:scale-105"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo((active + 1) % slides.length)}
        aria-label="Next team member"
        className="absolute right-0 sm:-right-2 top-[calc(50%-14px)] -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-brand-chrome shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform active:scale-90 hover:scale-105"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="mt-2 flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slideKey(slide)}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-7 bg-brand-sea" : "w-2 bg-brand-chrome hover:bg-brand-ink/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
