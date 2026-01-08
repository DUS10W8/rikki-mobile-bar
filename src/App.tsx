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
  Martini,
  Check,
} from "lucide-react";

import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { useForm, ValidationError } from "@formspree/react";

import Gallery from "./components/ui/Gallery";
import { galleryItems } from "./data/gallery";

// Sections you added (living in /components/ui/)
import TechFeatures from "./components/ui/TechFeatures";
import ComingSoon from "./components/ui/ComingSoon";

/** Use Vite base for all public assets so GitHub Pages project URLs work. */
const BASE = import.meta.env.BASE_URL;
const R_LOGO_SRC = `${BASE}r-logo.png`;

type SectionId =
  | "about"
  | "menu"
  | "food"
  | "features"
  | "packages"
  | "coming-soon"
  | "gallery"
  | "book";

export default function App() {
  const [active, setActive] = useState<SectionId>("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [formState, formspreeSubmit] = useForm("xgvgzrnn");

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
    about: "About",
    menu: "Drinks",
    food: "Food",
    features: "Van & Experience",
    packages: "Packages",
    "coming-soon": "Coming Soon",
    gallery: "Gallery",
    book: "Book",
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
              Check your date
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
              <span className="sr-only">Book the bar</span>
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
        <section id="about" className="bg-[radial-gradient(circle_at_top,_#fffaf3,_#f3ece2)] pb-16 pt-8 md:pt-12">
          <div className="mx-auto max-w-6xl px-4">
            {/* Logo Hero Image */}
            <div className="flex justify-center mb-2 -mx-4">
              <img 
                src={`${BASE}rikkis-logo.png`}
                alt="Rikki's Mobile Bar logo"
                className="h-64 sm:h-80 md:h-96 w-auto max-w-[90%]"
                loading="eager"
              />
            </div>

            <div className="flex flex-col gap-10 md:flex-row md:items-start">
            {/* Left copy */}
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-chrome bg-white/70 px-3 py-1 text-xs font-medium text-brand-ink/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-sea/10 text-brand-sea">
                  <Star className="size-3" />
                </span>
                Licensed mobile bar • Tri-Cities & beyond
              </div>

              <h1 className="text-balance text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                Mid-century cool. Future-ready service.
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed text-brand-ink/80">
                Rikki's Mobile Bar is a licensed mobile experience company offering elevated bar service, curated food, professional audio and DJ support, and seamless event production.
              </p>
              <p className="text-lg sm:text-xl leading-relaxed text-brand-ink/80">
                We handle the details—so you can enjoy a celebration that feels effortless, polished, and unforgettable.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-brand-ink/80">
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

              <div className="mt-6 flex flex-wrap items-center gap-4">
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

              <dl className="mt-6 grid max-w-md grid-cols-2 gap-4 text-xs text-brand-ink/80 md:text-sm">
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

            {/* Right visual */}
            <div className="relative flex-1">
              <Card className="relative rounded-[2rem] border-brand-chrome bg-white/90 shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-ink/60">
                        Rikki’s Mobile Bar
                      </p>
                      <p className="text-sm font-semibold text-brand-ink/90">
                        1978 Ford Club Wagon • Cream & chrome
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-brand-chrome/60 bg-brand-primary px-2 py-1 text-[11px] font-medium text-brand-ink/80">
                      <Martini className="size-3" />
                      In build-out • Booking now
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-brand-chrome bg-[radial-gradient(circle_at_top,_#fdf7f0,_#ece2d6)]">
                    <picture className="block aspect-[4/3] w-full">
                      <source
                        type="image/webp"
                        srcSet={`${BASE}rikkis-hero-image-800.webp 800w, ${BASE}rikkis-hero-image-1200.webp 1200w, ${BASE}rikkis-hero-image-1600.webp 1600w`}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                      <img
                        src={`${BASE}rikkis-hero-image-1200.jpg`}
                        srcSet={`${BASE}rikkis-hero-image-800.jpg 800w, ${BASE}rikkis-hero-image-1200.jpg 1200w, ${BASE}rikkis-hero-image-1600.jpg 1600w`}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        alt="1978 Ford Club Wagon mobile bar with fold-out bar"
                        className="h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs text-brand-ink/80">
                    <div>
                      <div className="font-semibold">Cold storage</div>
                      <div className="text-[11px] text-brand-ink/70">for mixers & garnishes</div>
                    </div>
                    <div>
                      <div className="font-semibold">Fold-out bar</div>
                      <div className="text-[11px] text-brand-ink/70">with MCM profiles</div>
                    </div>
                    <div>
                      <div className="font-semibold">Satellite bar</div>
                      <div className="text-[11px] text-brand-ink/70">for bigger guest counts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="pointer-events-none absolute -left-6 -top-6 size-28 rounded-full bg-brand-sea/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-brand-rust/10 blur-3xl" />
            </div>
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
        <section id="packages" className="border-t border-brand-chrome/70 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Packages & starting points.</h2>
                <p className="text-sm leading-relaxed text-brand-ink/80 md:text-base">
                  Every event is a little different. These are starting points—we’ll dial in the menu, staffing, and
                  flow based on your guest count and venue.
                </p>
              </div>
              <div className="text-xs text-brand-ink/80 md:text-sm">
                <p className="font-semibold text-base">What's always included:</p>
                <ul className="mt-2 space-y-2 text-base">
                  <li>• Licensed bar service</li>
                  <li>• Custom menu planning</li>
                  <li>• Required food service</li>
                  <li>• Setup & breakdown</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  name: "Beer & Wine Bar",
                  blurb: "A streamlined setup focused on beer, wine, and a signature spritz or two.",
                  bestFor: "Receptions, open houses, and casual celebrations.",
                },
                {
                  name: "Classic Cocktail Bar",
                  blurb: "A focused menu of shaken & stirred classics tailored to your crowd.",
                  bestFor: "Weddings, milestones, and private parties.",
                },
                {
                  name: "Premium / Mocktail Bar",
                  blurb: "Elevated cocktails and zero-proof options with thoughtful garnishes.",
                  bestFor: "Crowds that love a good drink—and a good photo.",
                },
              ].map((pkg) => (
                <Card key={pkg.name} className="flex h-full flex-col rounded-2xl border-brand-chrome bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl font-bold">{pkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between space-y-4 text-base text-brand-ink/80 md:text-lg">
                    <div>
                      <p className="font-medium">{pkg.blurb}</p>
                      <p className="mt-2 text-sm md:text-base text-brand-ink/70">For: {pkg.bestFor}</p>
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
                      Request quote
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
        <section id="gallery" className="border-t border-brand-chrome/70 bg-brand-primary/80 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">In-progress snapshots.</h2>
                <p className="mt-1 text-sm text-brand-ink/80">
                  As we convert the van and refine the bar setup, we’ll keep sharing how it all comes together.
                </p>
              </div>
              <div className="hidden text-xs uppercase tracking-[0.16em] text-brand-ink/60 md:block">
                More photos coming as we build
              </div>
            </div>

            <Gallery items={galleryItems} />
          </div>
        </section>

        {/* Book / Contact */}
        <section id="book" className="bg-white/60 py-16 pb-28 md:pb-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Book the Bar</h2>
              <p className="mt-3 max-w-2xl mx-auto text-base md:text-lg text-brand-ink/80 leading-relaxed">
                Give us the basics and we'll reply with availability and a quote.
              </p>
            </div>

            <form className="mt-10 grid md:grid-cols-2 gap-5" onSubmit={formspreeSubmit}>
              <div className="md:col-span-1">
                <label htmlFor="fullName" className="sr-only">
                  Full name
                </label>
                <Input id="fullName" name="fullName" placeholder="Full name" required />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <Input id="email" name="email" type="email" placeholder="Email" required />
                <ValidationError prefix="Email" field="email" errors={formState.errors} />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="phone" className="sr-only">
                  Phone
                </label>
                <Input id="phone" name="phone" type="tel" placeholder="Phone" />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="date" className="sr-only">
                  Event date
                </label>
                <Input id="date" name="date" type="date" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="venue" className="sr-only">
                  Venue / Address
                </label>
                <Input id="venue" name="venue" placeholder="Venue / Address" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="package" className="sr-only">
                  Package
                </label>
                <select
                  id="package"
                  name="package"
                  className="h-touch w-full rounded-md border-2 border-brand-chrome bg-white px-4 py-3 text-base font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-sea focus-visible:border-brand-sea transition-all enabled:hover:border-brand-ink/40 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  aria-label="Select a package"
                >
                  <option value="" disabled>
                    Choose a package
                  </option>
                  <option value="Beer & Wine">Beer &amp; Wine</option>
                  <option value="Classic Cocktails">Classic Cocktails</option>
                  <option value="Premium Cocktails">Premium Cocktails</option>
                  <option value="Dry / Mocktail Bar">Dry / Mocktail Bar</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Guest count, vibe, must-have drinks…"
                  className="min-h-[120px]"
                />
                <ValidationError prefix="Message" field="message" errors={formState.errors} />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  type="submit"
                  disabled={formState.submitting}
                  size="lg"
                  fullWidth
                  className="sm:w-auto"
                  aria-label={formState.submitting ? "Sending your request" : "Submit booking form"}
                >
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                  <span className="font-semibold">{formState.submitting ? "Sending..." : "Request Availability"}</span>
                </Button>

                <div aria-live="polite" role="status" className="text-sm md:text-base leading-relaxed">
                  {formState.succeeded && (
                    <span className="text-brand-ink/80">
                      Thanks! We&apos;ve received your request and will contact you soon.
                    </span>
                  )}
                </div>
              </div>
            </form>

            {/* Fast facts */}
            <dl className="mt-10 grid md:grid-cols-3 gap-6">
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
              Packages
            </button>
            <button type="button" onClick={() => scrollToSection("gallery")} className="hover:text-brand-ink">
              Gallery
            </button>
            <button type="button" onClick={() => scrollToSection("book")} className="hover:text-brand-ink">
              Book
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
    </div>
  );
}
