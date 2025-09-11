import React, { useState, useEffect } from "react";
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Star,
  Truck,
  Instagram,
  Menu,
  Martini,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

export default function MobileBarSite() {
  const [sent, setSent] = useState(false);
  const [active, setActive] = useState<string>("about");
  const [menuOpen, setMenuOpen] = useState(false);

  // Observe sections for active nav highlight
  useEffect(() => {
    const ids = ["about", "van", "packages", "gallery", "faq", "contact"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { threshold: 0.5 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-brand-primary text-brand-ink">
      {/* Top ribbon */}
      <div className="w-full bg-gradient-to-r from-brand-rust via-brand-sea to-brand-rust text-white text-sm py-2">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 justify-center">
          <Truck className="w-4 h-4" />
          <span>Serving the Tri-Cities & greater Columbia River area • Est. 1978 vibes</span>
        </div>
      </div>

      {/* Header / Nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-brand-chrome">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#about" className="flex items-center gap-3">
            <img src="/R LOGO.png" alt="Rikki’s Mobile Bar" className="h-10 w-auto" />
            <span className="sr-only">Rikki’s Mobile Bar</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {[
              ["about", "About"],
              ["van", "The Van"],
              ["packages", "Packages"],
              ["gallery", "Gallery"],
              ["faq", "FAQ"],
              ["contact", "Contact"],
            ].map(([id, label]) => {
              const isActive = active === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  className={[
                    "text-[15px] transition-colors underline-offset-8",
                    isActive
                      ? "text-brand-sea underline decoration-2"
                      : "text-brand-ink/80 hover:text-brand-ink hover:underline",
                  ].join(" ")}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* CTA (desktop) */}
          <a href="#contact" className="hidden md:inline-flex">
            <Button className="rounded-2xl bg-brand-sea border-brand-sea text-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
              Get a Quote
            </Button>
          </a>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-brand-chrome">
            <nav className="flex flex-col p-4 space-y-3">
              {[
                ["about", "About"],
                ["van", "The Van"],
                ["packages", "Packages"],
                ["gallery", "Gallery"],
                ["faq", "FAQ"],
                ["contact", "Contact"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={[
                    "text-[15px] transition-colors underline-offset-8",
                    active === id
                      ? "text-brand-sea underline decoration-2"
                      : "text-brand-ink/80 hover:text-brand-ink hover:underline",
                  ].join(" ")}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Parchment gradient + soft brand glows */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#efe4cf_0%,#ead9c1_100%)]" />
          <div className="absolute -top-40 -right-28 w-[30rem] h-[30rem] rounded-full bg-brand-sea/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-28 w-[26rem] h-[26rem] rounded-full bg-brand-rust/20 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-18 md:py-24 lg:py-28 grid md:grid-cols-2 gap-20 items-start">
          {/* LEFT — tighter rhythm & constrained measure */}
          <div className="max-w-2xl">
            <div className="flex justify-center md:justify-start mb-6 -mt-2">
              <div className="relative">
                {/* subtle “chrome echo” */}
                <div className="absolute -inset-5 rounded-[2rem] bg-gradient-radial from-white/25 via-transparent to-transparent blur-xl pointer-events-none" />
                <img
                  src="/rikki's logo.png"
                  alt="Rikki’s Mobile Bar emblem"
                  className="h-32 w-auto sm:h-36 md:h-44 lg:h-52 xl:h-56 select-none [filter:drop-shadow(0_4px_10px_rgba(0,0,0,0.15))]"
                  draggable={false}
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>

            <h1 className="font-heading font-black text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.04] tracking-[-0.006em] max-w-[18ch]">
              Vintage bar service—anywhere you celebrate.
            </h1>

            <p className="mt-5 text-lg text-brand-ink/80 max-w-prose">
              Poured from a cream ’78 Club Wagon. Foldable mid-century bar, chrome details, and
              ice-cold cocktails for weddings, parties, and riverside hangs.
            </p>

            {/* CTAs (plain Tailwind to avoid collisions) */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold bg-brand-sea text-white border border-brand-sea shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:opacity-90"
              >
                Check Your Date
              </a>
              <a
                href="#packages"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold bg-white text-brand-sea border border-brand-sea hover:bg-brand-sea/10"
              >
                See Packages
              </a>
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm text-brand-ink/70">
              <Badge className="rounded-xl bg-brand-rust text-white">Licensed & Insured</Badge>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Tri-Cities, WA
              </span>
            </div>
          </div>

          {/* RIGHT — crisper chrome edge & tighter features */}
          <Card className="rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border-brand-chrome/80">
            <CardContent className="p-6">
              <div className="aspect-video rounded-2xl bg-[radial-gradient(100%_100%_at_50%_0%,#ffffff_0%,#f4eee4_100%)] border border-brand-chrome/70 flex items-center justify-center">
                <span className="text-brand-ink/60">
                  Hero image of the cream ’78 Club Wagon + bar (placeholder)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                {[
                  { label: "Cold storage", sub: "mixers & garnishes" },
                  { label: "Foldable bar", sub: "MCM profile" },
                  { label: "Satellite bar", sub: "add-on ready" },
                ].map((f) => (
                  <div key={f.label} className="text-sm">
                    <div className="font-semibold">{f.label}</div>
                    <div className="text-brand-ink/60">{f.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">
            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.005em]">
              Rooted in hospitality. Built for the good times.
            </h2>
            <p className="mt-4 text-brand-ink/80 max-w-prose">
              Rikki grew up between motocross tracks and a Nevada ranch, then spent 10–15 years
              perfecting hospitality. The mobile bar blends that grit and polish—professional
              service with a laid-back, riverside vibe.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                "Fast, easy setup & teardown",
                "Premium, durable bar top (butcher block)",
                "Vintage whites, woodgrain & chrome trim",
                "Content capture add-on for your event",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Star className="w-5 h-5 mt-1 text-brand-sea" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl">Fast facts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-brand-ink/80 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-sea" /> Weddings • Parties • Corporate
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-sea" /> Based in Kennewick — will travel
              </div>
              <div className="flex items-center gap-2">
                <Martini className="w-4 h-4 text-brand-sea" /> Beer/Wine • Classics • Mocktails
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-sea" /> 1978 Ford Club Wagon service van
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Van & Bar */}
      <section id="van" className="scroll-mt-24 bg-white border-y border-brand-chrome">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">The van & foldable bar</h2>
          <p className="mt-3 text-brand-ink/80 max-w-prose">
            A cream 1978 Club Wagon outfitted with a mid-century modern foldable bar: rounded
            corners, chrome corner guards, antique-white finish, and a butcher-block worktop. Cold
            storage keeps mixers and garnishes crisp, while a satellite bar can expand service.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              ["Durable bar top", "Butcher block with food-safe finish"],
              ["Retro aesthetic", "Vintage whites, woodgrain, chrome"],
              ["Quick setup", "Pack/unpack in minutes"],
            ].map(([title, sub]) => (
              <Card key={title} className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-brand-ink/80">{sub}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Packages</h2>
        <p className="mt-3 text-brand-ink/80">
          All packages include the mobile bar, licensed bartending, ice wells, basic mixers, garnish
          kit, compostable cups/napkins, and cleanup. Ask about glassware upgrades and venue
          requirements.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            {
              name: "Beer & Wine",
              price: "Starting at $$$",
              bullets: ["Curated beer & wine service", "Chilled to pour-perfect", "Great for casual events"],
            },
            {
              name: "Classic Cocktails",
              price: "Starting at $$$",
              bullets: ["Old Fashioned, Margaritas, Mules", "Customizable menu", "Balanced, crowd-pleasing"],
            },
            {
              name: "Premium Cocktails",
              price: "Starting at $$$",
              bullets: ["Top-shelf spirits", "Fresh syrups/citrus", "Signature drinks"],
            },
            {
              name: "Dry/Mocktail Bar",
              price: "Starting at $$$",
              bullets: ["Crafted mocktails", "Inclusive & fun", "Great for daytime events"],
            },
          ].map((p) => (
            <Card key={p.name} className="rounded-3xl flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  <Badge className="rounded-xl bg-brand-rust text-white text-xs">{p.price}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-brand-ink/80 space-y-2 flex-1">
                {p.bullets.map((b) => (
                  <div key={b} className="flex items-start gap-2">
                    <Star className="w-4 h-4 mt-[2px] text-brand-sea" /> {b}
                  </div>
                ))}
              </CardContent>
              <div className="px-6 pb-6">
                <a href="#contact">
                  <Button className="w-full rounded-2xl bg-brand-sea border-brand-sea text-white">
                    Request Quote
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            ["Satellite Bar", "Add a second service point to speed lines."],
            ["Content Capture", "We can record & stream highlights for your guests."],
            ["Generator/Ice Service", "Self-contained power & ample ice for hot days."],
          ].map(([t, s]) => (
            <Card key={t} className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg">{t}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-brand-ink/80">{s}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="scroll-mt-24 bg-white border-y border-brand-chrome">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Gallery</h2>
          <p className="mt-3 text-brand-ink/80">
            A peek at the look & feel. Swap these placeholders with your photos when ready.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-2xl bg-brand-primary border border-brand-chrome flex items-center justify-center"
              >
                <span className="text-brand-ink/60 text-sm">Image {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What folks are saying</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            "The vintage van was a total vibe—our guests loved it!",
            "Smooth setup, pro service, and delicious cocktails.",
            "The mocktail bar kept everyone happy during our daytime event.",
          ].map((quote, i) => (
            <Card key={i} className="rounded-3xl">
              <CardContent className="p-6 text-brand-ink/80 italic">“{quote}”</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-white border-y border-brand-chrome">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">FAQ</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {[
              [
                "Do you provide the alcohol?",
                "We can provide guidance and shopping lists. Depending on venue and event type, we’ll align with local regulations.",
              ],
              ["How far do you travel?", "Tri-Cities and surrounding areas, with custom travel available."],
              ["Do you have insurance?", "Yes—fully licensed and insured. Venue certificates available on request."],
              [
                "What power/water is required?",
                "We can be self-contained with generator/ice add-ons; otherwise standard venue hookups work great.",
              ],
            ].map(([q, a]) => (
              <Card key={q} className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">{q}</CardTitle>
                </CardHeader>
                <CardContent className="text-brand-ink/80">{a}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Check your date</h2>
            <p className="mt-3 text-brand-ink/80">
              Tell us about your event and the package you’re interested in. We’ll reply with
              availability and pricing.
            </p>
            <div className="mt-6 space-y-3 text-sm text-brand-ink/80">
              <a href="mailto:hello@rikkismobilebar.com" className="flex items-center gap-2 hover:opacity-80">
                <Mail className="w-4 h-4" /> hello@rikkismobilebar.com
              </a>
              <a href="tel:+15095550123" className="flex items-center gap-2 hover:opacity-80">
                <Phone className="w-4 h-4" /> (509) 555-0123
              </a>
              <a
                href="https://instagram.com/rikkis.mobile.bar"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Instagram className="w-4 h-4" /> @rikkis.mobile.bar
              </a>
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardContent className="p-6">
              {sent ? (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold">Thanks! 🎉</h3>
                  <p className="mt-2 text-brand-ink/80">We’ll be in touch shortly about your event.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Full name" required />
                    <Input type="email" placeholder="Email" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Phone" />
                    <Input type="date" placeholder="Event date" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Guest count (approx.)" />
                    <Input placeholder="Venue/City" />
                  </div>
                  <select className="border rounded-xl h-10 px-3 bg-white">
                    {[
                      "Select a package",
                      "Beer & Wine",
                      "Classic Cocktails",
                      "Premium Cocktails",
                      "Dry/Mocktail Bar",
                    ].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Tell us about your vibe, timeline, and any add-ons (satellite bar, content capture, generator, glassware)."
                    className="min-h-[120px]"
                  />
                  <Button type="submit" className="rounded-2xl bg-brand-sea border-brand-sea text-white">
                    Send Inquiry
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-chrome bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="font-extrabold text-lg">Rikki’s Mobile Bar</div>
            <div className="text-sm text-brand-ink/70">
              Vintage whites • Chrome trim • Woodgrain • Rounded corners
            </div>
          </div>
          <div className="text-sm text-brand-ink/70">
            © {new Date().getFullYear()} Rikki’s Mobile Bar. All rights reserved.
          </div>
          <div className="flex justify-start md:justify-end gap-4 text-sm">
            <a href="#packages" className="hover:text-brand-ink">
              Packages
            </a>
            <a href="#gallery" className="hover:text-brand-ink">
              Gallery
            </a>
            <a href="#contact" className="hover:text-brand-ink">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-0 px-4 z-50">
        <a href="#contact" className="block">
          <button className="w-full rounded-2xl bg-brand-sea text-white py-3 font-semibold shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
            Check Your Date
          </button>
        </a>
      </div>
    </div>
  );
}
