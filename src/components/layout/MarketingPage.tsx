import type { ReactNode } from "react";
import { Instagram, Phone, Mail, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { BUSINESS } from "../../lib/seo";

const BASE = import.meta.env.BASE_URL;

export type Crumb = { label: string; href?: string };

export type FaqItem = { q: string; a: ReactNode };

/** Shared chrome (header/footer/CTA banner/FAQ) for standalone marketing & blog routes. */

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-chrome bg-[#fff8ec]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-2xl border border-brand-chrome bg-[radial-gradient(circle_at_top,_#fffaf3,_#e8ddcf)] shadow-sm">
            <img src={`${BASE}r-logo.png`} alt="Rikki's Mobile Bar R emblem" className="h-6 w-6" loading="lazy" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-brand-ink">Rikki's Mobile Bar</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-brand-ink/60">
              1985 Club Wagon &bull; Tri-Cities, WA
            </div>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <a href="/#book" className="hidden sm:block">
            <Button variant="outline" size="sm" className="rounded-2xl border-brand-ink/25 bg-white">
              Get a Quote
            </Button>
          </a>
          <a href="/#book">
            <Button size="sm" className="chrome-button rounded-2xl border-brand-sea bg-brand-sea text-white">
              Check Availability
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-5 pt-6 text-xs text-brand-ink/60">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
            {item.href ? (
              <a href={item.href} className="hover:text-brand-ink hover:underline">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="font-medium text-brand-ink/80">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CtaBanner({
  heading = "Ready to shape the right setup?",
  body = "Share your date, guest count, and event style. We'll confirm availability and send a live estimate.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section className="border-t border-brand-chrome/70 bg-[linear-gradient(180deg,#fffaf3_0%,#ffffff_100%)] py-12">
      <div className="mx-auto max-w-4xl px-5">
        <Card className="overflow-hidden rounded-[1.75rem] border-brand-chrome bg-white/95 shadow-[0_20px_60px_rgba(20,20,20,0.08)]">
          <div className="h-1.5 bg-[linear-gradient(90deg,#c69d4f,#2e9b8a,#b96b4d)]" />
          <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">{heading}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-ink/72 md:text-base">{body}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <a href="/#book" className="w-full sm:w-auto">
                <Button className="chrome-button w-full rounded-2xl border-brand-sea bg-brand-sea text-white sm:w-auto" size="lg">
                  Get a Quote
                </Button>
              </a>
              <a href="/#book" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-2xl border-brand-ink/25 bg-white sm:w-auto" size="lg">
                  Check Availability
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function FaqSection({ items, id = "faq" }: { items: FaqItem[]; id?: string }) {
  return (
    <section id={id} className="border-t border-brand-chrome/70 bg-white py-14">
      <div className="mx-auto max-w-3xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">Common questions</h2>
        <div className="mt-6 divide-y divide-brand-chrome/60 rounded-[1.5rem] border border-brand-chrome bg-brand-primary/40">
          {items.map((item) => (
            <div key={item.q} className="p-5">
              <h3 className="text-base font-bold text-brand-ink md:text-lg">{item.q}</h3>
              <div className="mt-2 text-sm leading-relaxed text-brand-ink/78 md:text-base">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RelatedLinks({
  heading = "Explore more",
  links,
}: {
  heading?: string;
  links: { href: string; label: string; desc: string }[];
}) {
  return (
    <section className="border-t border-brand-chrome/70 bg-brand-primary/60 py-14">
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="text-xl font-bold tracking-tight text-brand-ink md:text-2xl">{heading}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group flex flex-col rounded-2xl border border-brand-chrome bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold text-brand-ink group-hover:text-brand-sea">{l.label}</span>
              <span className="mt-1 text-sm text-brand-ink/70">{l.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-brand-chrome bg-white">
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-10 md:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <div className="text-sm font-semibold text-brand-ink">Rikki's Mobile Bar</div>
          <p className="max-w-xs text-xs leading-relaxed text-brand-ink/70">
            Licensed vintage mobile bar service from a restored 1985 Club Wagon, serving weddings and private events
            across the Tri-Cities, Walla Walla, and Yakima, Washington.
          </p>
          <div className="flex flex-col gap-1 pt-2 text-xs text-brand-ink/70">
            <a href={`tel:${BUSINESS.telephone}`} className="inline-flex items-center gap-2 hover:text-brand-ink">
              <Phone className="size-3.5" /> {BUSINESS.telephoneDisplay}
            </a>
            <a href={`mailto:${BUSINESS.email}`} className="inline-flex items-center gap-2 hover:text-brand-ink">
              <Mail className="size-3.5" /> {BUSINESS.email}
            </a>
            <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-brand-ink">
              <Instagram className="size-3.5" /> @rikkismobile
            </a>
          </div>
        </div>
        <div className="text-xs text-brand-ink/70">
          <div className="mb-2 font-semibold text-brand-ink">Service pages</div>
          <ul className="space-y-1.5">
            <li><a href="/wedding-bartender-tri-cities-wa" className="hover:text-brand-ink hover:underline">Wedding Bartending</a></li>
            <li><a href="/mobile-bar-tri-cities-wa" className="hover:text-brand-ink hover:underline">Tri-Cities Mobile Bar</a></li>
            <li><a href="/mobile-bar-walla-walla-wa" className="hover:text-brand-ink hover:underline">Walla Walla Mobile Bar</a></li>
            <li><a href="/licensed-mobile-bar-washington" className="hover:text-brand-ink hover:underline">Licensed Alcohol Service</a></li>
          </ul>
        </div>
        <div className="text-xs text-brand-ink/70">
          <div className="mb-2 font-semibold text-brand-ink">Planning guides</div>
          <ul className="space-y-1.5">
            <li><a href="/blog" className="hover:text-brand-ink hover:underline">All guides</a></li>
            <li><a href="/blog/wedding-bartender-cost-washington" className="hover:text-brand-ink hover:underline">Bartender cost guide</a></li>
            <li><a href="/blog/how-much-alcohol-for-100-wedding-guests" className="hover:text-brand-ink hover:underline">Alcohol calculator</a></li>
            <li><a href="/blog/wedding-bar-checklist" className="hover:text-brand-ink hover:underline">Wedding bar checklist</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-chrome/70 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 text-xs text-brand-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Rikki's Mobile Bar. All rights reserved.</span>
          <span className="flex gap-3">
            <a href="/privacy" className="hover:text-brand-ink">Privacy</a>
            <a href="/terms" className="hover:text-brand-ink">Terms</a>
            <a href="/" className="hover:text-brand-ink">Home</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fff8ec] text-brand-ink">
      <MarketingHeader />
      <main id="main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
