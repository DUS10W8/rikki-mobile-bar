import { useEffect, type ReactNode } from "react";
import { Instagram, Martini, Sparkles, Star, UserRoundPlus } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const LINKS = {
  googleReview: "https://share.google/rWmy9Y602W20Ynrff",
  instagram: "https://www.instagram.com/rikkismobile/",
  facebook: "https://www.facebook.com/people/Rikkis-Mobile/61584650340060/",
  book: "https://www.rikkismobile.com",
} as const;

const iconShell =
  "flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-ink/18 bg-white/65 text-brand-ink sm:size-12";

function IconInShell({ children }: { children: ReactNode }) {
  return (
    <span className={iconShell} aria-hidden="true">
      <span className="flex size-[1.4rem] items-center justify-center sm:size-6 [&_svg]:size-full [&_svg]:stroke-[1.5]">
        {children}
      </span>
    </span>
  );
}

function ArtDecoFan() {
  return (
    <svg
      className="mx-auto h-5 w-32 text-brand-ink/25"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M60 2v16M45 18L60 2l15 16M30 18L60 4l30 14M15 18L60 6l45 12M0 18L60 8l60 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function DecoCorners() {
  return (
    <div className="pointer-events-none absolute inset-2.5 border border-brand-ink/[0.08] sm:inset-3" aria-hidden="true">
      <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-brand-ink/20 sm:h-5 sm:w-5" />
      <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-brand-ink/20 sm:h-5 sm:w-5" />
      <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-brand-ink/20 sm:h-5 sm:w-5" />
      <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-brand-ink/20 sm:h-5 sm:w-5" />
    </div>
  );
}

type ConnectCardProps = {
  href: string;
  label: string;
  subtitle: string;
  icon: ReactNode;
  featured?: boolean;
  external?: boolean;
  recommendedPill?: boolean;
};

function ConnectCard({ href, label, subtitle, icon, featured, external, recommendedPill }: ConnectCardProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={[
        "group relative block w-full overflow-hidden rounded-[1.35rem] px-4 py-[1.125rem] text-left sm:px-5 sm:py-5",
        "min-h-[3.75rem] touch-manipulation will-change-transform",
        "border-2 text-brand-ink",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-1 motion-reduce:hover:translate-y-0",
        "active:translate-y-0 active:scale-[0.985] motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8ec]",
        featured
          ? [
              "bg-[linear-gradient(152deg,rgba(255,252,247,0.99),rgba(252,246,230,0.88),rgba(255,250,242,0.96))]",
              "border-brand-ink shadow-[0_22px_58px_rgba(37,25,19,0.175)] ring-1 ring-brand-ink/12",
              "hover:border-brand-ink hover:shadow-[0_30px_72px_rgba(37,25,19,0.22)]",
              "active:shadow-[0_12px_36px_rgba(37,25,19,0.15)]",
            ].join(" ")
          : [
              "border-brand-chrome/90 bg-white/85 shadow-[0_10px_36px_rgba(37,25,19,0.08)]",
              "hover:border-brand-ink/40 hover:shadow-[0_22px_56px_rgba(37,25,19,0.17)]",
              "active:shadow-[0_8px_26px_rgba(37,25,19,0.12)]",
            ].join(" "),
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-ink/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {recommendedPill ? (
        <div className="mb-1.5 flex justify-start sm:mb-2">
          <span className="rounded-full border border-brand-ink/12 bg-[#fffdf8]/90 px-1.5 py-px text-[8px] font-semibold uppercase tracking-[0.1em] text-brand-ink/58">
            Recommended
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3.5">
          <IconInShell>{icon}</IconInShell>
          <div className="min-w-0 flex-1 py-0.5">
            <span className="block font-heading text-base font-semibold leading-snug tracking-tight text-brand-ink sm:text-lg">
              {label}
            </span>
            <span
              className={[
                "block text-pretty text-xs font-medium leading-snug sm:text-[13px]",
                featured ? "mt-1.5 text-brand-ink/78 sm:mt-2" : "mt-1 text-brand-ink/76",
              ].join(" ")}
            >
              {subtitle}
            </span>
          </div>
        </div>

        <span
          className={[
            "inline-flex shrink-0 select-none items-baseline gap-0 whitespace-nowrap pt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-ink/55",
            "transition-[color] duration-200 group-hover:text-brand-ink/82 sm:text-[11px] sm:tracking-[0.08em]",
          ].join(" ")}
          aria-hidden="true"
        >
          OPEN&nbsp;
          <span className="inline-block translate-x-0 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            →
          </span>
        </span>
      </div>

      {external ? <span className="sr-only">Opens in a new tab.</span> : null}
    </a>
  );
}

export default function ConnectPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Enjoying the experience? — Rikki’s Mobile Bar";
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? null;
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Follow Rikki’s Mobile Bar, leave a Google review, or book the vintage mobile bar for your next Tri-Cities event."
      );
    }
    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc !== null) metaDesc.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="min-h-screen luxury-page-shell text-brand-ink">
      <div className="pointer-events-none fixed -left-24 top-32 size-64 rounded-full border border-brand-chrome/45 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none fixed -right-20 bottom-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.65),rgba(199,161,91,0.1)_45%,transparent_68%)]"
        aria-hidden="true"
      />

      <main id="main" className="relative mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-8 md:max-w-xl">
        <header className="relative mb-5 text-center sm:mb-6">
          <DecoCorners />
          <div className="relative px-1 pb-4 pt-5 sm:px-3 sm:pb-5 sm:pt-7">
            <div className="mb-2 flex justify-center gap-1 text-brand-ink/35" aria-hidden="true">
              <Star className="size-3 stroke-[1.5] text-brand-ink/45" />
              <Sparkles className="size-3.5 stroke-[1.5] text-brand-ink/40" />
              <Star className="size-2.5 stroke-[1.5] text-brand-ink/38" />
              <Sparkles className="size-3 stroke-[1.5] text-brand-ink/40" />
              <Star className="size-3 stroke-[1.5] text-brand-ink/45" />
            </div>

            <div className="mx-auto w-fit shadow-[0_6px_44px_rgba(255,252,245,0.92),0_2px_20px_rgba(199,161,91,0.1)]">
              <img
                src={`${BASE}rikkis-logo.png`}
                alt="Rikki’s Mobile Bar"
                className="mx-auto h-28 w-auto max-w-[min(100%,260px)] contrast-[1.07] brightness-[1.03] saturate-[1.05] sm:h-36 sm:contrast-[1.05] md:h-40"
                width={260}
                height={148}
                decoding="async"
                fetchPriority="high"
              />
            </div>

            <div className="luxury-divider mx-auto mt-2.5 max-w-xs sm:mt-3" />
            <div className="-mb-0.5 mt-1 sm:mt-1.5">
              <ArtDecoFan />
            </div>

            <h1 className="mt-2 text-balance font-heading text-2xl font-semibold leading-[1.15] tracking-tight text-brand-ink sm:mt-2.5 sm:text-3xl sm:font-bold md:text-[2rem]">
              Enjoying The Experience?
            </h1>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-brand-ink/82 sm:mt-2 sm:text-base">
              Your support helps a local family business grow.
            </p>
            <p className="mx-auto mt-2 max-w-md text-pretty text-xs leading-relaxed text-brand-ink/74 sm:mt-2.5 sm:text-sm">
              Follow us, leave a review, or book Rikki’s for your next event.
            </p>
          </div>
        </header>

        <div className="luxury-divider mb-5 w-full max-w-md self-center sm:mb-6" />

        <nav className="flex flex-col gap-3 sm:gap-3.5" aria-label="Connect with Rikki’s Mobile Bar">
          <ConnectCard
            href={LINKS.googleReview}
            label="Leave a Google Review"
            subtitle="Most helpful for our small business"
            icon={<Star className="text-brand-ink" />}
            featured
            recommendedPill
            external
          />
          <ConnectCard
            href={LINKS.instagram}
            label="Follow on Instagram"
            subtitle="@rikkismobile"
            icon={<Instagram className="text-brand-ink" />}
            external
          />
          <ConnectCard
            href={LINKS.facebook}
            label="Follow on Facebook"
            subtitle="Rikki’s Mobile Bar"
            icon={<UserRoundPlus className="text-brand-ink" />}
            external
          />
          <ConnectCard
            href={LINKS.book}
            label="Book Rikki’s"
            subtitle="Plan your next event"
            icon={<Martini className="text-brand-ink" />}
          />
        </nav>

        <div className="mt-6 w-full max-w-md self-center border-t border-brand-ink/10 pt-5 sm:mt-7">
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-center text-[11px] font-medium leading-snug tracking-[0.06em] text-brand-ink/60 sm:text-xs">
              Serving Tri-Cities, WA
            </p>
            <div className="luxury-divider w-full max-w-xs" />
            <p className="text-center text-xs font-medium tracking-[0.12em] text-brand-ink/62 sm:text-sm">
              Craft Cocktails • Elevated Atmosphere
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
