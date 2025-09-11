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

import Gallery from "./components/ui/Gallery";
import { galleryItems } from "./data/gallery";

// Sections from /ui
import FoodOptions from "./components/ui/FoodOptions";
import TechFeatures from "./components/ui/TechFeatures";

// Images served from /public
const R_LOGO_SRC = "/r-logo.png";
const EMBLEM_SRC = "/rikkis-logo.png";
const BOOKING_EMAIL = "hello@rikkismobilebar.com";

// Include new sections
type SectionId =
  | "about"
  | "menu"
  | "food"
  | "features"
  | "packages"
  | "gallery"
  | "book";

export default function App() {
  const [active, setActive] = useState<SectionId>("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sections on the page, in order
  const sections = useMemo<SectionId[]>(
    () => ["about", "menu", "food", "features", "packages", "gallery", "book"],
    []
  );

  // Show these in the header (order matters)
  const visibleNavIds = useMemo<SectionId[]>(
    () => ["about", "menu", "food", "features", "gallery", "book"],
    []
  );

  const labelMap: Record<SectionId, string> = {
    about: "About",
    menu: "Menu",
    food: "Food",
    features: "Tech",
    packages: "Packages",
    gallery: "Gallery",
    book: "Book",
  };

  const navLinks = useMemo(
    () => visibleNavIds.map((id) => ({ id, label: labelMap[id] })),
    [visibleNavIds]
  );

  // If a hidden section becomes active, map to the nearest visible one
  const order: SectionId[] = [
    "about",
    "menu",
    "food",
    "features",
    "packages",
    "gallery",
    "book",
  ];
  function effectiveActive(current: SectionId): SectionId {
    if (visibleNavIds.includes(current)) return current;
    const i = order.indexOf(current);
    for (let step = 1; step < order.length; step++) {
      const fwd = order[i + step];
      if (fwd && visibleNavIds.includes(fwd)) return fwd;
      const back = order[i - step];
      if (back && visibleNavIds.includes(back)) return back;
    }
    return visibleNavIds[0];
  }

  // Header shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.01 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handleNavClick = (id: SectionId) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Simple mailto workflow (for now)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const nextErrors: Record<string, string> = {};
    if (!fd.get("fullName")) nextErrors.fullName = "Please tell us your name.";
    if (!fd.get("email")) nextErrors.email = "We need your email to reply.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const subject = "Rikki’s Mobile Bar — New Inquiry";
    const body = [
      `Name: ${fd.get("fullName") || ""}`,
      `Email: ${fd.get("email") || ""}`,
      `Phone: ${fd.get("phone") || ""}`,
      `Date: ${fd.get("date") || ""}`,
      `Venue: ${fd.get("venue") || ""}`,
      `Package: ${fd.get("package") || ""}`,
      "",
      "Message:",
      `${fd.get("message") || ""}`,
    ].join("\n");

    setIsSubmitting(true);
    try {
      window.location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      setSent(true);
      form.reset();
    } catch {
      setError("Could not open your email app. Please email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Link styles (active chip forced white text)
  const navLinkClasses = (isActive: boolean) =>
    [
      "rounded-xl px-3 py-2 text-sm font-medium transition-colors outline-none",
      "focus-visible:ring-2 focus-visible:ring-brand-sea/50",
      isActive ? "!text-white bg-brand-sea" : "text-brand-ink/80 hover:text-brand-ink hover:bg-brand-ink/10",
    ].join(" ");

  return (
    <div className="min-h-screen bg-parchment text-brand-ink">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-brand-chrome transition-shadow ${
          scrolled ? "shadow-sm" : ""
        } overflow-hidden`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <a href="#about" className="inline-flex items-center gap-3">
              <img
                src={R_LOGO_SRC}
                alt="Rikki’s Mobile Bar — R monogram"
                width={44}
                height={44}
                loading="eager"
                className="rounded-md"
              />
              <span className="sr-only">Rikki’s Mobile Bar</span>
            </a>

            {/* Desktop Nav */}
            <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
              {navLinks.map(({ id, label }) => {
                const isActive = effectiveActive(active) === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={() => handleNavClick(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={navLinkClasses(isActive)}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex">
              <Button
                onClick={() =>
                  document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                leftIcon={<Martini className="size-4" aria-hidden="true" />}
              >
                Get a Quote
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-brand-ink/15 p-2"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="primary-mobile-nav"
            >
              <MenuIcon className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Panel */}
        {menuOpen && (
          <div
            id="primary-mobile-nav"
            role="dialog"
            aria-modal="true"
            className="md:hidden border-t border-brand-chrome bg-white"
          >
            <div className="mx-auto max-w-6xl px-4 py-2 grid grid-cols-2 gap-2">
              {navLinks.map(({ id, label }) => {
                const isActive = effectiveActive(active) === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={() => handleNavClick(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-medium outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand-sea/50",
                      isActive ? "!text-white bg-brand-sea" : "text-brand-ink/80 hover:text-brand-ink hover:bg-brand-ink/10",
                    ].join(" ")}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section id="about" className="relative" aria-label="About Rikki’s Mobile Bar">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
            {/* LEFT: centered content */}
            <div className="text-center">
              <img
                src={EMBLEM_SRC}
                alt="Rikki’s Mobile Bar emblem"
                width={512}
                height={512}
                loading="eager"
                decoding="async"
                className="mx-auto h-auto w-48 sm:w-56 md:w-64 drop-shadow-md"
              />

              <h1 className="mt-5 text-5xl/tight sm:text-6xl font-extrabold tracking-tight [text-wrap:balance] mx-auto max-w-3xl">
                Vintage Van. Future-Ready Bar.
              </h1>

              {/* NEW — shorter, more suggestive intro */}
              <p className="mt-4 text-lg text-brand-ink/80 mx-auto max-w-2xl">
                A mid-century mobile bar for the Tri-Cities. Two pros with
                25 years of hospitality, pouring classics and one-off menus with
                an easy, modern touch. Drinks lead the night—everything else
                reveals itself as you go.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="rust">Licensed &amp; Insured</Badge>
                <Badge variant="sea">Custom Menus</Badge>
                <Badge variant="outline">Mocktail Friendly</Badge>
                <Badge variant="outline">Food Optional</Badge>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  onClick={() =>
                    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  leftIcon={<Martini className="size-4" aria-hidden="true" />}
                >
                  Get a Quote
                </Button>

                <a
                  href="https://instagram.com/rikkis.mobile.bar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-ink/80 hover:text-brand-ink"
                  aria-label="Instagram: @rikkis.mobile.bar"
                >
                  <Instagram className="size-5" aria-hidden="true" />
                  <span className="text-sm">@rikkis.mobile.bar</span>
                </a>
              </div>
            </div>

            {/* RIGHT: hero image */}
            <div className="relative">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/rikkis-hero-image-800.webp 800w, /rikkis-hero-image-1200.webp 1200w, /rikkis-hero-image-1600.webp 1600w"
                  sizes="(min-width:1024px) 640px, 100vw"
                />
                <source
                  type="image/jpeg"
                  srcSet="/rikkis-hero-image-800.jpg 800w, /rikkis-hero-image-1200.jpg 1200w, /rikkis-hero-image-1600.jpg 1600w"
                  sizes="(min-width:1024px) 640px, 100vw"
                />
                <img
                  src="/rikkis-hero-image-1600.jpg"
                  alt="1978 Club Wagon mobile bar setup with awning and counter"
                  width={1600}
                  height={900}
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto rounded-2xl border border-brand-chrome shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* Menu cards */}
        <section id="menu" className="py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Martini className="size-5" />,
                  title: "Classics & Signatures",
                  copy:
                    "Old Fashioneds, Margaritas, Spritzes—and 70s throwbacks like Harvey Wallbangers reimagined.",
                },
                {
                  icon: <Star className="size-5" />,
                  title: "Custom Menus",
                  copy:
                    "We’ll build a one-off menu with your story, colors, and favorite spirits (or zero-proof).",
                },
                {
                  icon: <Truck className="size-5" />,
                  title: "Anywhere Service",
                  copy:
                    "Backyard, barn, vineyard, or river. Fast setup, tidy teardown, and power-smart equipment.",
                },
              ].map((card, i) => (
                <Card
                  key={i}
                  className="rounded-2xl border border-brand-ink/20 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <span aria-hidden="true">{card.icon}</span>
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-brand-ink/80">{card.copy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Food Options (optional add-on) */}
        <FoodOptions />

        {/* Tech & Setup */}
        <TechFeatures />

        {/* Packages */}
        <section id="packages" className="py-14 bg-white/60">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">Packages</h2>
            <p className="mt-2 text-brand-ink/80">
              Transparent pricing with customizable add-ons. Tell us your guest
              count and vibe—we’ll tune the menu and staff.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-6 items-stretch">
              {[
                {
                  name: "River Social",
                  price: "Starting at $",
                  bullets: ["2 hours", "Beer/Wine + Signature", "Bartender + Glassware"],
                },
                {
                  name: "Wedding Classic",
                  price: "Starting at $$",
                  bullets: ["4 hours", "Full Cocktail Menu", "2 Bartenders + Bar Back"],
                },
                {
                  name: "Premium",
                  price: "Starting at $$$",
                  bullets: ["5 hours", "Craft & Zero-Proof", "Custom Build-outs"],
                },
              ].map((p) => (
                <Card
                  key={p.name}
                  className="rounded-2xl border border-brand-ink/20 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] flex flex-col"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="grow">
                    <p className="text-brand-ink/80">{p.price}</p>
                    <ul className="mt-3 space-y-1 text-sm">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2">
                          <Check className="size-4" aria-hidden="true" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() =>
                        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    >
                      Get this package
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">Gallery</h2>
            <p className="mt-2 text-brand-ink/80">
              A few looks—we’ll update this as our season rolls on.
            </p>
            <div className="mt-6">
              <Gallery items={galleryItems} />
            </div>
          </div>
        </section>

        {/* Booking */}
        <section id="book" className="py-14 bg-white/60 pb-28 md:pb-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">Book the Bar</h2>
            <p className="mt-2 text-brand-ink/80">
              Give us the basics and we’ll reply with availability and a quote.
            </p>

            <form className="mt-8 grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="md:col-span-1">
                <label htmlFor="fullName" className="sr-only">
                  Full name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Full name"
                  aria-invalid={!!errors.fullName || undefined}
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="md:col-span-1">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  aria-invalid={!!errors.email || undefined}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                )}
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
                <Input id="date" name="date" type="date" placeholder="Event date" />
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
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a package
                  </option>
                  <option>River Social</option>
                  <option>Wedding Classic</option>
                  <option>Premium</option>
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
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <Button
                  type="submit"
                  leftIcon={<Calendar className="size-4" aria-hidden="true" />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Opening your email app…" : "Request Availability"}
                </Button>
                <div aria-live="polite" className="text-sm">
                  {sent && !error && (
                    <span className="text-brand-ink/80">
                      Thanks! Your email app should have opened. If not, email us at{" "}
                      {BOOKING_EMAIL}.
                    </span>
                  )}
                  {error && <span className="text-destructive">{error}</span>}
                </div>
              </div>
            </form>

            {/* Fast facts */}
            <dl className="mt-10 grid md:grid-cols-3 gap-6">
              {[
                { icon: <MapPin className="size-5" />, term: "Area", desc: "Tri-Cities & Columbia River" },
                { icon: <Phone className="size-5" />, term: "Text/Call", desc: "(509) 555-0123" },
                { icon: <Mail className="size-5" />, term: "Email", desc: "hello@rikkismobilebar.com" },
              ].map((it) => (
                <div key={it.term} className="rounded-2xl border border-brand-chrome bg-white p-5">
                  <dt className="flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden="true">{it.icon}</span>
                    {it.term}
                  </dt>
                  <dd className="mt-1 text-brand-ink/80">{it.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40">
        <Button
          className="w-full"
          onClick={() =>
            document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          leftIcon={<Martini className="size-4" aria-hidden="true" />}
        >
          Get a Quote
        </Button>
      </div>

      {/* Footer */}
      <footer className="mt-24 md:mt-12 border-t border-brand-chrome bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={R_LOGO_SRC}
              alt="R monogram"
              width={28}
              height={28}
              loading="lazy"
              className="rounded-md"
            />
            <p className="text-sm text-brand-ink/70">
              © {new Date().getFullYear()} Rikki’s Mobile Bar. All rights reserved.
            </p>
          </div>
          <a
            href="https://instagram.com/rikkis.mobile.bar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-ink/80 hover:text-brand-ink"
            aria-label="Instagram: @rikkis.mobile.bar"
          >
            <Instagram className="size-5" aria-hidden="true" />
            <span className="text-sm">@rikkis.mobile.bar</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
