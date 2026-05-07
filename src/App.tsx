import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Star,
  Truck,
  Instagram,
  Menu as MenuIcon,
  Check,
} from "lucide-react";

import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { BookingFlow } from "./booking/BookingFlow";

import Gallery from "./components/ui/Gallery";
import { galleryItems } from "./data/gallery";

// Sections you added (living in /components/ui/)
import TechFeatures from "./components/ui/TechFeatures";
import ComingSoon from "./components/ui/ComingSoon";

/** Use Vite base for all public assets so GitHub Pages project URLs work. */
const BASE = import.meta.env.BASE_URL;
const R_LOGO_SRC = `${BASE}r-logo.png`;
const HERO_VIDEO_SRC = `${BASE}header-video.mp4`;
const HERO_VIDEO_POSTER_SRC = `${BASE}epic-negative-r.png`;

type SectionId =
  | "about"
  | "menu"
  | "food"
  | "features"
  | "packages"
  | "coming-soon"
  | "gallery"
  | "book";

function HeroVideo() {
  return (
    <div className="hero-video-medallion" aria-label="Rikki's Mobile Bar vintage service preview">
      <div className="hero-video-halo" aria-hidden="true" />
      <div className="hero-video-frame">
        <video
          className="hero-video"
          src={HERO_VIDEO_SRC}
          poster={HERO_VIDEO_POSTER_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState<SectionId>("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sections on the page, in order
  const sections = useMemo<SectionId[]>(
    () => ["about", "menu", "features", "packages", "coming-soon", "gallery", "book"],
    []
  );

  // Header nav (order matters) - removed "food" to de-emphasize food service
  const visibleNavIds = useMemo<SectionId[]>(
    () => ["about", "menu", "features", "packages", "coming-soon", "gallery", "book"],
    []
  );

  const labelMap: Record<SectionId, string> = {
    about: "Home",
    menu: "Drinks",
    food: "Food",
    features: "Van & Experience",
    packages: "Pricing",
    "coming-soon": "Coming Soon",
    gallery: "Gallery",
    book: "Availability",
  };

  /** Observe sections for active state + header style */
  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      const headerOffset = 120; // Account for sticky header
      const triggerPoint = window.scrollY + headerOffset;

      let best: { id: SectionId; score: number } | null = null;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        const sectionBottom = sectionTop + rect.height;

        // Only consider sections that are visible in viewport
        if (sectionBottom < window.scrollY || sectionTop > window.scrollY + window.innerHeight) {
          continue;
        }

        // Calculate score: prefer sections whose top is at or just past the trigger point
        let score: number;
        if (sectionTop <= triggerPoint && sectionBottom >= triggerPoint) {
          // Section contains trigger point - prefer sections that just passed it
          score = triggerPoint - sectionTop; // Lower is better (closer to trigger)
        } else if (sectionTop > triggerPoint) {
          // Section is below trigger - use distance with penalty
          score = sectionTop - triggerPoint + 1000;
        } else {
          // Section is above trigger - higher penalty
          score = triggerPoint - sectionBottom + 2000;
        }

        if (!best || score < best.score) {
          best = { id, score };
        }
      }

      if (best) setActive(best.id);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    };

    // Initial check
    updateActiveSection();

    // Update on scroll with throttling via requestAnimationFrame
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  /** Scroll listener for header chrome styling */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Smooth scroll helper */
  const scrollToSection = (id: SectionId) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Link styles (active chip forced white text)
  const navLinkClasses = (isActive: boolean) =>
    [
      "rounded-xl px-3 py-2 text-sm font-medium transition-colors outline-none",
      "focus-visible:ring-2 focus-visible:ring-brand-sea/50",
      isActive ? "!text-white bg-brand-sea" : "text-brand-ink/80 hover:text-brand-ink hover:bg-brand-ink/10",
    ].join(" ");

  return (
    <div className="min-h-screen bg-brand-primary text-brand-ink">
      {/* Top ribbon */}
      <div className="w-full bg-gradient-to-r from-brand-rust via-brand-sea to-brand-rust text-white text-xs sm:text-sm py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4">
          <Truck className="size-4" />
          <span>Serving Tri-Cities & the Columbia River • Licensed mobile bar</span>
        </div>
      </div>

      {/* Header */}
      <header
        className={[
          "sticky top-0 z-40 border-b border-brand-chrome/70 backdrop-blur",
          scrolled ? "bg-brand-primary/85 shadow-[0_10px_30px_rgba(0,0,0,0.14)]" : "bg-brand-primary/80",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo cluster */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/50"
            onClick={() => scrollToSection("about")}
          >
            <div className="flex size-9 items-center justify-center rounded-2xl border border-brand-chrome bg-[radial-gradient(circle_at_top,_#fffaf3,_#e8ddcf)] shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
              <img
                src={R_LOGO_SRC}
                alt="Rikki’s R emblem"
                className="h-6 w-6"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold tracking-tight">Rikki’s Mobile Bar</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-brand-ink/60">
                ’78 Club Wagon • Tri-Cities
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {visibleNavIds.map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => scrollToSection(id)}
                className={navLinkClasses(active === id)}
              >
                {labelMap[id]}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="ml-2 rounded-2xl border-brand-sea bg-brand-sea text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] hover:bg-brand-sea/90"
              onClick={() => scrollToSection("book")}
            >
              Check availability
            </Button>
          </nav>

          {/* Mobile nav buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-brand-chrome bg-white/90 p-2"
              onClick={() => scrollToSection("book")}
            >
              <Calendar className="w-4 h-4" />
              <span className="sr-only">Check availability</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-brand-chrome bg-white/90 p-2"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MenuIcon className="w-4 h-4" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-t border-brand-chrome bg-brand-primary/95 md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 text-sm">
              {visibleNavIds.map((id) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={[
                    "flex items-center justify-between rounded-xl px-3 py-2 text-left",
                    active === id ? "bg-brand-sea text-white" : "text-brand-ink/90 hover:bg-brand-ink/10",
                  ].join(" ")}
                >
                  {labelMap[id]}
                  {active === id && <Check className="size-4" aria-hidden="true" />}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero / About */}
        <section
          id="about"
          className="flex min-h-[100svh] bg-[radial-gradient(circle_at_top,_#fffaf3,_#f3ece2)] pb-12 pt-5 md:block md:min-h-0 md:pb-16 md:pt-12"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col px-4">
            {/* Logo Hero Image */}
            <div className="-mx-4 mb-2 hidden justify-center md:flex">
              <img
                src={`${BASE}rikkis-logo.png`}
                alt="Rikki's Mobile Bar logo"
                className="h-64 sm:h-80 md:h-96 w-auto max-w-[90%]"
                loading="eager"
              />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-7 md:flex-row md:items-center md:justify-between md:gap-12">
              <div className="order-1 flex w-full justify-center md:order-2 md:flex-1 md:justify-end">
                <HeroVideo />
              </div>

              {/* Left copy */}
              <div className="order-2 max-w-xl space-y-4 text-center md:order-1 md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-chrome bg-white/70 px-3 py-1 text-xs font-medium text-brand-ink/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-sea/10 text-brand-sea">
                  <Star className="size-3" />
                </span>
                Licensed & insured mobile bar • Tri-Cities & beyond
              </div>

              <h1 className="text-balance text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                A vintage mobile bar made for unforgettable celebrations.
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed text-brand-ink/80">
                Rikki's brings polished bar service, curated cocktails, and a 1978 Club Wagon centerpiece to weddings, private parties, and standout events across the Tri-Cities.
              </p>
              <div className="mt-4 hidden flex-wrap gap-2 text-sm text-brand-ink/80 md:flex">
                <Badge className="rounded-full bg-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm font-medium">
                  1978 Club Wagon • MCM-inspired bar
                </Badge>
                <Badge className="rounded-full bg-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm font-medium">
                  Licensed & insured
                </Badge>
                <Badge className="rounded-full bg-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm font-medium">
                  Custom menus + light food to meet requirements
                </Badge>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <Button
                  className="rounded-2xl border-brand-sea bg-brand-sea text-white shadow-[0_14px_40px_rgba(0,0,0,0.24)]"
                  onClick={() => scrollToSection("book")}
                >
                  Check availability
                </Button>
                <button
                  type="button"
                  onClick={() => scrollToSection("packages")}
                  className="text-sm font-medium text-brand-ink/80 hover:text-brand-ink"
                >
                  View packages
                </button>
              </div>

              <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-left text-xs text-brand-ink/80 md:mx-0 md:text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-brand-sea" />
                  <div>
                    <dt className="font-semibold">Events</dt>
                    <dd>Weddings, parties, corporate, & more</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-brand-rust" />
                  <div>
                    <dt className="font-semibold">Based in</dt>
                    <dd>Tri-Cities, WA & surrounding areas</dd>
                  </div>
                </div>
              </dl>
              </div>

            </div>
          </div>
        </section>

        {/* Event fit */}
        <section className="border-t border-brand-chrome/70 bg-white/75 py-10">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">
                  Designed for
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                  Events where the bar should feel intentional.
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-brand-ink/80 sm:grid-cols-3 md:flex md:flex-wrap md:justify-end">
                {["Weddings", "Backyard parties", "Corporate events", "Birthdays", "Bridal showers", "Private dinners"].map(
                  (eventType) => (
                    <div
                      key={eventType}
                      className="rounded-full border border-brand-chrome/70 bg-brand-primary/70 px-4 py-2 text-center shadow-sm"
                    >
                      {eventType}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Van moment */}
        <section className="border-t border-brand-chrome/70 bg-brand-primary/80 py-14 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-sea">
                The centerpiece
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                The bar is part of the moment.
              </h2>
              <p className="text-lg leading-relaxed text-brand-ink/80 md:text-xl">
                Guests walk up to a vintage bar, order something beautiful, and instantly feel like the party was designed with intention.
              </p>
              <Button
                variant="outline"
                className="rounded-2xl border-brand-ink/20 bg-white/80 text-brand-ink hover:bg-white"
                onClick={() => scrollToSection("gallery")}
              >
                See the build
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-brand-chrome bg-white shadow-[0_24px_70px_rgba(20,20,20,0.18)]">
                <img
                  src={`${BASE}gallery/editorial-bar-service-guests-1200.jpg`}
                  alt="Guests ordering from Rikki's Mobile Bar at an outdoor event"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-5">
                  <p className="max-w-xs text-xs font-semibold leading-relaxed text-white/95 md:text-sm">
                    Warm service, real guests, and the van doing what it was built to do.
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5">
              {[
                "Vintage 1978 Ford Club Wagon presence",
                "Cream, chrome, and warm mid-century details",
                "Photo-worthy guest experience without slowing service",
              ].map((detail) => (
                <div key={detail} className="flex items-start gap-3 rounded-[1.25rem] border border-brand-chrome bg-white/80 px-4 py-3 shadow-sm">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-sea/10 text-brand-sea">
                    <Check className="size-4" />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-brand-ink/80 md:text-base">{detail}</p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-brand-chrome/70 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">
                How it works
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Premium service, simple planning.
              </h2>
              <p className="text-lg leading-relaxed text-brand-ink/80">
                Tell us the shape of your event. We help dial in the bar program, setup, staffing, and guest flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Choose your service style",
                  body: "Beer and wine, classic cocktails, or a signature-forward menu with elevated zero-proof options.",
                },
                {
                  step: "02",
                  title: "Customize the guest experience",
                  body: "We plan drinks, garnishes, light food requirements, staffing, and optional audio or DJ support.",
                },
                {
                  step: "03",
                  title: "We handle the service flow",
                  body: "Setup, bar service, cleanup, and venue-friendly communication are handled with calm, polished hospitality.",
                },
              ].map((item) => (
                <Card key={item.step} className="rounded-2xl border-brand-chrome bg-brand-primary/55">
                  <CardContent className="p-5">
                    <div className="text-sm font-semibold text-brand-rust">{item.step}</div>
                    <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-brand-ink/75">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Menu / Drinks */}
        <section id="menu" className="border-t border-brand-chrome/70 bg-white/70 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">The drinks come first.</h2>
                <p className="text-lg leading-relaxed text-brand-ink/80 md:text-xl">
                  Custom menus built for your event—classics, signatures, or zero-proof options.
                </p>
              </div>
              <p className="max-w-sm text-base text-brand-ink/70 md:text-lg">
                Balanced selections for fast service and happy guests.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Cocktails",
                  items: ["Classic builds (think margaritas, sours, old fashioneds)", "One or two signatures"],
                },
                {
                  title: "Beer & Wine",
                  items: ["Thoughtful beer & wine picks suited to your crowd and venue"],
                },
                {
                  title: "Zero-Proof",
                  items: ["Intentionally built mocktails so non-drinkers don’t feel like an afterthought"],
                },
              ].map((section) => (
                <Card key={section.title} className="rounded-2xl border-brand-chrome bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-base text-brand-ink/80 md:text-lg font-medium">
                      {section.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features / Van */}
        <section id="features" className="border-t border-brand-chrome/70 bg-brand-primary/80 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Built for a smooth bar flow.</h2>
                <p className="text-lg leading-relaxed text-brand-ink/80 md:text-xl">
                  Designed from the inside out for fast service, easy setup, and happy guests.
                </p>

                <div className="grid gap-3 text-sm text-brand-ink/80 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Service-first</h3>
                    <p className="mt-2 leading-relaxed text-base">
                      10+ years hospitality experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Local partners</h3>
                    <p className="mt-2 leading-relaxed text-base">
                      Work with Tri-Cities venues.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Food service</h3>
                    <p className="mt-2 leading-relaxed text-base">
                      All requirements handled simply.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Tech-ready</h3>
                    <p className="mt-2 leading-relaxed text-base">
                      WiFi & live-stream setups available.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <TechFeatures />
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="border-t border-brand-chrome/70 bg-[linear-gradient(180deg,#fffaf3_0%,#ffffff_100%)] py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Clear starting points, customized to your event.</h2>
                <p className="text-sm leading-relaxed text-brand-ink/80 md:text-base">
                  Choose a service direction. We'll scale staffing, menu depth, and setup needs to your guest count.
                </p>
                <p className="mt-2 text-sm text-brand-ink/70">
                  Every estimate includes the real logistics: planning, service, setup, cleanup, and the right bar flow for the guest count.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-brand-chrome bg-white/85 p-5 text-sm text-brand-ink/80 shadow-[0_18px_50px_rgba(20,20,20,0.08)]">
                <p className="font-semibold text-base">Always included</p>
                <ul className="mt-3 grid gap-2 text-base md:grid-cols-2">
                  <li>Licensed bar service</li>
                  <li>Custom menu planning</li>
                  <li>Required food service</li>
                  <li>Setup & breakdown</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  name: "Beer & Wine Bar",
                  subtitle: "Simple, fast, and intentional.",
                  blurb: "Beer & wine plus a small set of simple mixed drinks—built for clean service flow and happy guests.",
                  examples: "Examples: spritz, rum & coke, jack & diet, classic margarita.",
                  isPopular: false,
                },
                {
                  name: "Classic Cocktail Bar",
                  subtitle: "Classics + a few signatures.",
                  blurb:
                    "A curated menu of crowd-pleasing classics with a limited signature set—balanced for speed, consistency, and polish.",
                  examples: "Examples: margarita, whiskey sour, old fashioned + 2–3 signatures.",
                  isPopular: true,
                },
                {
                  name: "Premium / Mocktail Bar",
                  subtitle: "Signature-forward + zero-proof done right.",
                  blurb:
                    "An expanded signature cocktail menu with elevated ingredients, garnishes, and intentional zero-proof options.",
                  examples: "Includes: 3–5 signatures + elevated mocktails.",
                  isPopular: false,
                },
              ].map((pkg) => (
                <Card
                  key={pkg.name}
                  className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-chrome bg-white/95 shadow-[0_20px_60px_rgba(20,20,20,0.08)]"
                >
                  <div className="h-1.5 bg-[linear-gradient(90deg,#b96b4d,#2e9b8a,#c69d4f)]" />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl md:text-2xl font-bold">{pkg.name}</CardTitle>
                      {pkg.isPopular && (
                        <Badge variant="sea" size="sm" className="shrink-0">
                          Most popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-brand-ink/70 mt-1">{pkg.subtitle}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between space-y-4 text-base text-brand-ink/80 md:text-lg">
                    <div>
                      <p className="font-medium">{pkg.blurb}</p>
                      {pkg.examples && <p className="mt-2 text-sm md:text-base text-brand-ink/70">{pkg.examples}</p>}
                    </div>
                    <ul className="space-y-2 text-base font-medium">
                      <li>• Curated drink menu</li>
                      <li>• Professional bartending</li>
                      <li>• Food service included</li>
                    </ul>
                  </CardContent>
                  <div className="px-6 pb-5">
                    <Button
                      className="w-full rounded-2xl border-brand-sea bg-brand-sea text-white"
                      onClick={() => scrollToSection("book")}
                      size="lg"
                    >
                      Check availability
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coming soon as its own section */}
        <ComingSoon />

        {/* Gallery */}
        <section id="gallery" className="border-t border-brand-chrome/70 bg-brand-primary/80 py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">A closer look at the experience.</h2>
                <p className="mt-1 text-sm text-brand-ink/80">
                  The van, the drinks, the setup details, and the kind of guest moments the bar is built to create.
                </p>
              </div>
              <div className="hidden text-xs uppercase tracking-[0.16em] text-brand-ink/60 md:block">
                More photos coming as we build
              </div>
            </div>

            <div className="mb-5 grid overflow-hidden rounded-[1.75rem] border border-brand-chrome bg-white/88 shadow-[0_24px_70px_rgba(20,20,20,0.12)] md:grid-cols-[1.3fr_0.7fr]">
              <div className="aspect-[4/3] md:aspect-[16/10]">
                <img
                  src={`${BASE}gallery/editorial-team-service-flow-1200.jpg`}
                  alt="Rikki's Mobile Bar team member preparing drinks behind the bar"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col justify-center gap-3 p-5 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">
                  Built for the details
                </p>
                <h3 className="text-2xl font-bold leading-tight md:text-3xl">
                  Menus, garnish, glassware, and service flow all work together.
                </h3>
                <p className="text-base leading-relaxed text-brand-ink/75">
                  The experience should look composed in photos and feel easy at the bar. That balance is the whole point.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-brand-chrome bg-brand-primary/60 px-3 py-1 text-xs font-semibold text-brand-ink/75">
                    Custom menus
                  </span>
                  <span className="rounded-full border border-brand-chrome bg-brand-primary/60 px-3 py-1 text-xs font-semibold text-brand-ink/75">
                    Service-ready setup
                  </span>
                </div>
              </div>
            </div>

            <Gallery items={galleryItems} />
          </div>
        </section>

        {/* Book / Contact */}
        <section id="book" className="bg-[linear-gradient(180deg,#ffffff_0%,#f3ece2_100%)] py-14 pb-28 md:py-20 md:pb-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Check availability for your event</h2>
              <p className="mt-3 mx-auto max-w-2xl text-base leading-relaxed text-brand-ink/80 md:text-lg">
                Share a few event details for an instant starting estimate. We'll confirm availability and refine your quote after review.
              </p>
            </div>

            {/* Pricing Anchor */}
            <Card className="mb-8 overflow-hidden rounded-[1.75rem] border border-brand-chrome bg-white/92 shadow-[0_24px_70px_rgba(20,20,20,0.1)]">
              <div className="h-1.5 bg-[linear-gradient(90deg,#c69d4f,#2e9b8a,#b96b4d)]" />
              <CardContent className="p-6 md:p-8">
                <div className="mx-auto max-w-3xl text-center space-y-3">
                  <div>
                    <div className="text-3xl font-bold text-brand-sea md:text-4xl">Events start at $800</div>
                    <div className="text-sm text-brand-ink/70 mt-1">
                      Includes planning, licensed & insured service, travel, setup, and breakdown.
                    </div>
                  </div>
                  <div className="text-xs text-brand-ink/60 pt-3 border-t border-brand-chrome/50">
                    Final pricing is based on your guest count and the drink program you choose (plus any tech add-ons).
                  </div>
                  <div className="text-xs text-brand-ink/60 mt-2">
                    Most events invest more based on their specific needs and scale.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <div className="mb-8 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[1.25rem] border border-brand-chrome/50 bg-white/78 p-4 text-center shadow-sm">
                <div className="font-semibold text-brand-ink mb-1">10+ years</div>
                <div className="text-xs text-brand-ink/70">hospitality experience</div>
              </div>
              <div className="rounded-[1.25rem] border border-brand-chrome/50 bg-white/78 p-4 text-center shadow-sm">
                <div className="font-semibold text-brand-ink mb-1">Licensed & insured</div>
                <div className="text-xs text-brand-ink/70">venue docs available</div>
              </div>
              <div className="rounded-[1.25rem] border border-brand-chrome/50 bg-white/78 p-4 text-center shadow-sm">
                <div className="font-semibold text-brand-ink mb-1">Built by operators</div>
                <div className="text-xs text-brand-ink/70">not rental companies</div>
              </div>
              <div className="rounded-[1.25rem] border border-brand-chrome/50 bg-white/78 p-4 text-center shadow-sm">
                <div className="font-semibold text-brand-ink mb-1">Tri-Cities–based</div>
                <div className="text-xs text-brand-ink/70">venue-friendly service</div>
              </div>
            </div>

            {/* Consolidated Reassurance */}
            <Card className="mb-8 rounded-[1.5rem] border border-brand-chrome bg-white/90 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="font-semibold text-brand-ink mb-1">This takes about 2 minutes.</div>
                <div className="text-sm text-brand-ink/70">
                  Get a clear estimate and next steps — no payment required.
                </div>
              </CardContent>
            </Card>

            {/* Authority Statement */}
            <div className="mb-8 text-center">
              <p className="text-sm text-brand-ink/70">
                We'll review your details and confirm availability before anything is finalized.
              </p>
            </div>

            <BookingFlow formspreeId="xgvgzrnn" />

            {/* Fast facts */}
            <dl className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { icon: <MapPin className="size-5" />, term: "Area", desc: "Tri-Cities & Columbia River" },
                { icon: <Phone className="size-5" />, term: "Text/Call", desc: "(509) 231-9307" },
                { icon: <Mail className="size-5" />, term: "Email", desc: "rikki@rikkismobile.com" },
              ].map((it) => (
                <div key={it.term} className="rounded-2xl border border-brand-chrome bg-white p-5">
                  <dt className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span aria-hidden="true">{it.icon}</span>
                    {it.term}
                  </dt>
                  <dd className="mt-1 text-center text-xs text-brand-ink/80">{it.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-chrome bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3 md:items-center">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Rikki’s Mobile Bar</div>
            <p className="text-xs text-brand-ink/70">
              Vintage whites • Chrome trim • Woodgrain • Rounded corners
            </p>
          </div>
          <div className="text-xs text-brand-ink/70">
            © {new Date().getFullYear()} Rikki’s Mobile Bar. All rights reserved.
          </div>
          <div className="flex justify-start gap-4 text-xs md:justify-end">
            <button type="button" onClick={() => scrollToSection("packages")} className="hover:text-brand-ink">
              Pricing
            </button>
            <button type="button" onClick={() => scrollToSection("gallery")} className="hover:text-brand-ink">
              Gallery
            </button>
            <button type="button" onClick={() => scrollToSection("book")} className="hover:text-brand-ink">
              Availability
            </button>
            <a
              href="https://instagram.com/rikkismobile"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-brand-ink"
            >
              <Instagram className="size-3" />
              <span>@rikkismobile</span>
            </a>
          </div>
        </div>
      </footer>

      {scrolled && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-chrome/70 bg-brand-primary/95 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.16)] backdrop-blur md:hidden">
          <Button
            className="w-full rounded-2xl border-brand-sea bg-brand-sea text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
            onClick={() => scrollToSection("book")}
          >
            Check availability
          </Button>
        </div>
      )}
    </div>
  );
}
