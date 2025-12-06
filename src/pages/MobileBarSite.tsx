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

import { useForm, ValidationError } from "@formspree/react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

export default function MobileBarSite() {
  const [state, handleSubmit] = useForm("xgvgzrnn");
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
          <a href="#about" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl border border-brand-chrome bg-brand-primary flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <Martini className="w-4 h-4 text-brand-rust" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight">Rikki’s Mobile Bar</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-brand-ink/60">
                Tri-Cities • Since 1978 (at heart)
              </div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {[
              ["about", "About"],
              ["van", "The Van"],
              ["packages", "Packages"],
              ["gallery", "Gallery"],
              ["faq", "FAQ"],
              ["contact", "Availability"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`relative transition-colors ${
                  active === id ? "text-brand-sea" : "text-brand-ink/70 hover:text-brand-ink"
                }`}
              >
                {label}
                {active === id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-brand-sea" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex gap-2">
            <a href="#contact">
              <Button className="rounded-2xl bg-brand-sea border-brand-sea text-white text-sm px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                Check Your Date
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-brand-chrome bg-white shadow-sm"
            onClick={() => setMenuOpen((m) => !m)}
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-brand-chrome bg-white/95 backdrop-blur">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
              {[
                ["about", "About"],
                ["van", "The Van"],
                ["packages", "Packages"],
                ["gallery", "Gallery"],
                ["faq", "FAQ"],
                ["contact", "Availability"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2 text-sm ${
                    active === id ? "text-brand-sea font-semibold" : "text-brand-ink/80"
                  }`}
                >
                  {label}
                </a>
              ))}
              <a href="#contact" onClick={() => setMenuOpen(false)}>
                <Button className="mt-2 w-full rounded-2xl bg-brand-sea border-brand-sea text-white text-sm">
                  Check Your Date
                </Button>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-brand-chrome bg-[radial-gradient(circle_at_top,_#fffaf3,_#f3efe8)]">
        {/* Background chrome blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-28 w-[30rem] h-[30rem] rounded-full bg-brand-sea/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-28 w-[26rem] h-[26rem] rounded-full bg-brand-rust/20 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-18 md:py-24 lg:py-28 grid md:grid-cols-2 gap-20 items-start">
          {/* LEFT — tighter rhythm & constrained measure */}
          <div className="max-w-2xl">
            <div className="flex justify-center md:justify-start mb-6 -mt-2">
              <div className="relative">
                {/* subtle “chrome echo” */}
                <div className="absolute -inset-5 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent)] border border-brand-chrome/50 blur-xl opacity-80" />
                <img
                  src={`${import.meta.env.BASE_URL}rikkis-logo.png`}
                  alt="Rikki's Mobile Bar emblem"
                  className="h-32 w-auto sm:h-36 md:h-44 lg:h-52 xl:h-56 relative z-10"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-brand-chrome/70 bg-white/70 px-3 py-1 text-xs font-medium text-brand-ink/80 mb-4 backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-sea/10 text-brand-sea">
                <Star className="w-3 h-3" />
              </span>
              <span>Licensed mobile bar • Tri-Cities & beyond</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold tracking-tight leading-tight">
              A retro club wagon, a polished bar, and the drinks dialed in.
            </h1>
            <p className="mt-4 text-base md:text-lg text-brand-ink/80 leading-relaxed">
              Rikki’s Mobile Bar is a 1978 Ford Club Wagon turned mid-century modern inspired bar.
              We pull up, pop out the bar, and serve a curated menu of cocktails, mocktails, beer, and wine.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Badge className="rounded-full bg-white border-brand-chrome text-brand-ink/80 text-xs md:text-[11px]">
                Licensed & insured
              </Badge>
              <Badge className="rounded-full bg-white border-brand-chrome text-brand-ink/80 text-xs md:text-[11px]">
                Custom menus for your event
              </Badge>
              <Badge className="rounded-full bg-white border-brand-chrome text-brand-ink/80 text-xs md:text-[11px]">
                Light food service to meet requirements
              </Badge>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <a href="#contact">
                <Button className="rounded-2xl bg-brand-sea border-brand-sea text-white px-6 py-3 text-sm md:text-base shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
                  Check availability
                </Button>
              </a>
              <a href="#packages" className="text-sm md:text-base font-medium text-brand-ink/70 hover:text-brand-ink">
                View packages
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs md:text-sm text-brand-ink/70 max-w-md">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-sea" />
                <span>Weddings, private parties, corporate events</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-rust" />
                <span>Tri-Cities, WA & surrounding areas</span>
              </div>
              <div className="flex items-center gap-2">
                <Martini className="w-4 h-4 text-brand-ink/80" />
                <span>Custom cocktail & mocktail menus</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-ink/80" />
                <span>We roll in, set up, and break down</span>
              </div>
            </div>
          </div>

          {/* RIGHT — hero van visual */}
          <Card className="rounded-[2rem] border-brand-chrome bg-white/80 shadow-[0_18px_60px_rgba(0,0,0,0.14)] relative overflow-hidden">
            <CardContent className="p-6">
              <div className="aspect-video rounded-2xl bg-[radial-gradient(circle_at_top,_#fdf8f2,_#ece2d6)] border border-brand-chrome/70 flex items-center justify-center">
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
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Built from the ground up</h2>
            <p className="mt-4 text-brand-ink/80 leading-relaxed">
              Rikki grew up between motocross tracks and Nevada ranch land, then fell in love with hospitality on the
              Columbia River. Rikki’s Mobile Bar is her rolling version of a perfect night: good drinks, easy flow,
              and the kind of details you remember.
            </p>
            <p className="mt-4 text-brand-ink/80 leading-relaxed">
              Our 1978 Club Wagon is being thoughtfully converted with cold storage, efficient bar layout, and
              fold-out service to keep lines moving. We’re starting with a focused, dialed-in drink program and light
              food offerings to meet requirements—with tech-forward add-ons coming soon.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-brand-ink/80">
              <div>
                <div className="font-semibold">Service-forward</div>
                <p className="mt-1">
                  10+ years in hospitality means we care about sequence—how guests are greeted, served, and taken care
                  of all night.
                </p>
              </div>
              <div>
                <div className="font-semibold">Grounded in Tri-Cities</div>
                <p className="mt-1">
                  We’re based in the Tri-Cities and love partnering with local venues, vendors, and creatives.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl border-brand-chrome bg-white">
              <CardHeader>
                <CardTitle className="text-lg">What we’re focused on right now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-brand-ink/80">
                <div className="flex gap-3">
                  <span className="mt-1 h-6 w-6 rounded-full bg-brand-sea/10 flex items-center justify-center">
                    <Martini className="w-3 h-3 text-brand-sea" />
                  </span>
                  <div>
                    <div className="font-semibold">Dialed-in drink service</div>
                    <p className="mt-1">
                      A curated menu of cocktails, mocktails, beer, and wine designed around your event.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-6 w-6 rounded-full bg-brand-rust/10 flex items-center justify-center">
                    <Truck className="w-3 h-3 text-brand-rust" />
                  </span>
                  <div>
                    <div className="font-semibold">Smooth flow & setup</div>
                    <p className="mt-1">
                      We’re obsessive about layout, timing, and guest flow so your bar feels seamless, not chaotic.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-6 w-6 rounded-full bg-brand-ink/5 flex items-center justify-center">
                    <Star className="w-3 h-3 text-brand-ink/70" />
                  </span>
                  <div>
                    <div className="font-semibold">Food that meets requirements</div>
                    <p className="mt-1">
                      We provide required food service in a simple, compliant way and can coordinate with your caterer
                      or venue if needed—without taking focus away from the bar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Van layout / experience */}
      <section
        id="van"
        className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24 border-t border-brand-chrome/60"
      >
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">A 1978 Club Wagon, reimagined</h2>
            <p className="mt-3 text-brand-ink/80 leading-relaxed">
              Think vintage whites, chrome trim, woodgrain finishes, and rounded corners—paired with modern cold
              storage, power, and layout. The bar folds out from the van, creating a defined service zone that feels
              intentional and photogenic.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-brand-ink/80">
              <li>• Fold-out main bar with mid-century modern profiles</li>
              <li>• Dedicated back bar for efficient prep</li>
              <li>• Cold storage for mixers, garnishes, and essentials</li>
              <li>• Power & water hookups with generator options available</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl bg-white border-brand-chrome">
              <CardHeader>
                <CardTitle className="text-lg">What’s built in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-brand-ink/80">
                <div className="flex items-center justify-between">
                  <span>Cold storage for mixers & garnishes</span>
                  <Badge className="rounded-full bg-brand-primary border border-brand-chrome text-[11px]">
                    In progress
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Foldable bar with MCM bar top</span>
                  <Badge className="rounded-full bg-brand-primary border border-brand-chrome text-[11px]">
                    In progress
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Satellite bar add-on for high guest counts</span>
                  <Badge className="rounded-full bg-brand-primary border border-brand-chrome text-[11px]">
                    Coming soon
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl bg-white border-brand-chrome">
              <CardHeader>
                <CardTitle className="text-lg">Food & compliance</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-brand-ink/80 space-y-3">
                <p>
                  We meet required food service regulations with simple, event-appropriate options. That might look
                  like light bites, snack setups, or coordination with your caterer or venue—depending on what your
                  event needs.
                </p>
                <p>
                  Our primary focus is delivering an exceptional bar experience, and we make sure the food piece is
                  covered in a way that supports that.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section
        id="packages"
        className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24 border-t border-brand-chrome/60"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Packages & starting points</h2>
            <p className="mt-3 text-brand-ink/80 max-w-2xl">
              Every event is a little different. These packages are starting points—we’ll adjust the menu, staffing,
              and flow to fit your venue and guests.
            </p>
          </div>
          <div className="text-sm text-brand-ink/70">
            <div className="font-semibold">What’s always included</div>
            <ul className="mt-1 space-y-1">
              <li>• Licensed bar service</li>
              <li>• Custom menu planning</li>
              <li>• Required food service covered in a simple, compliant way</li>
              <li>• Setup & breakdown of the bar area</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
            <Card key={pkg.name} className="rounded-3xl border-brand-chrome bg-white flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4 text-sm text-brand-ink/80">
                <div>
                  <p>{pkg.blurb}</p>
                  <p className="mt-2 text-brand-ink/70">{pkg.bestFor}</p>
                </div>
                <ul className="space-y-1">
                  <li>• Curated drink menu</li>
                  <li>• Professional bartending staff</li>
                  <li>• Required food service covered with simple options</li>
                </ul>
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
            ["Generator & Power", "Perfect for off-grid or outdoor locations."],
          ].map(([label, desc]) => (
            <Card key={label} className="rounded-3xl bg-white/90 border-brand-chrome">
              <CardHeader>
                <CardTitle className="text-sm">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-brand-ink/80">{desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section
        id="gallery"
        className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24 border-t border-brand-chrome/60"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">In-progress snapshots</h2>
          <span className="text-xs uppercase tracking-[0.16em] text-brand-ink/60">
            More photos coming as we build
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-3xl bg-white border-brand-chrome">
            <CardContent className="p-4">
              <div className="aspect-[4/3] rounded-2xl bg-brand-primary/70 border border-brand-chrome/60 flex items-center justify-center text-sm text-brand-ink/70">
                Placeholder gallery image — van exterior
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl bg-white border-brand-chrome">
            <CardContent className="p-4">
              <div className="aspect-[4/3] rounded-2xl bg-brand-primary/70 border border-brand-chrome/60 flex items-center justify-center text-sm text-brand-ink/70">
                Placeholder gallery image — bar layout
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl bg-white border-brand-chrome">
            <CardContent className="p-4">
              <div className="aspect-[4/3] rounded-2xl bg-brand-primary/70 border border-brand-chrome/60 flex items-center justify-center text-sm text-brand-ink/70">
                Placeholder gallery image — mood & lighting
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24 border-t border-brand-chrome/60"
      >
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Questions, answered</h2>
            <p className="mt-3 text-brand-ink/80">
              We’re still building, but here’s what we can tell you about how Rikki’s Mobile Bar will show up for your
              event.
            </p>
          </div>
          <div className="space-y-3">
            {[
              [
                "Are you licensed and insured?",
                "Yes—Rikki’s Mobile Bar is a licensed mobile bar service with appropriate insurance. We can provide documentation to your venue if needed.",
              ],
              [
                "Do you provide food?",
                "Yes. We provide food options that meet Washington’s requirements for serving alcohol. That might look like simple, well-chosen bites or coordination with your caterer or venue.",
              ],
              [
                "What does a typical event look like?",
                "We arrive early to position the van, set up the bar, and prep garnishes. During service we keep the bar flowing smoothly and maintain a clean, photogenic setup.",
              ],
              [
                "Where do you travel?",
                "Tri-Cities and surrounding areas, with custom travel available.",
              ],
              [
                "Do you have insurance?",
                "Yes—fully licensed and insured. Venue certificates available on request.",
              ],
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

      {/* Contact / Availability */}
      <section
        id="contact"
        className="scroll-mt-24 max-w-6xl mx-auto px-4 py-16 md:py-24 border-t border-brand-chrome/60"
      >
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Check your date</h2>
            <p className="mt-3 text-brand-ink/80">
              Tell us about your event and the package you’re interested in. We’ll reply with availability and pricing.
            </p>
            <div className="mt-6 space-y-3 text-sm text-brand-ink/80">
              <a href="mailto:rikki@rikkismobile.com" className="flex items-center gap-2 hover:opacity-80">
                <Mail className="w-4 h-4" /> rikki@rikkismobile.com
              </a>
              <a href="tel:+15092319307" className="flex items-center gap-2 hover:opacity-80">
                <Phone className="w-4 h-4" /> (509) 231-9307
              </a>
              <a
                href="https://instagram.com/rikkismobile"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Instagram className="w-4 h-4" /> @rikkismobile
              </a>
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardContent className="p-6">
              {state.succeeded ? (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold">Thanks! 🎉</h3>
                  <p className="mt-2 text-brand-ink/80">
                    We’ll be in touch shortly about your event.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="fullName"
                      id="fullName"
                      placeholder="Full name"
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Email"
                      required
                    />
                  </div>
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="phone" id="phone" placeholder="Phone" />
                    <Input
                      type="date"
                      name="eventDate"
                      id="eventDate"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="guestCount"
                      id="guestCount"
                      placeholder="Guest count (approx.)"
                    />
                    <Input
                      name="venueCity"
                      id="venueCity"
                      placeholder="Venue/City"
                    />
                  </div>
                  <select
                    name="package"
                    id="package"
                    className="h-10 w-full rounded-md border border-brand-chrome bg-white px-3 py-2 text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/50 focus-visible:border-brand-sea transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a package
                    </option>
                    <option value="Beer & Wine">Beer &amp; Wine</option>
                    <option value="Classic Cocktails">Classic Cocktails</option>
                    <option value="Premium Cocktails">Premium Cocktails</option>
                    <option value="Dry / Mocktail Bar">Dry / Mocktail Bar</option>
                  </select>
                  <Textarea
                    name="message"
                    id="message"
                    placeholder="Tell us about your vibe, timeline, and any add-ons (satellite bar, content capture, generator, glassware)."
                    className="min-h-[120px]"
                  />
                  <ValidationError prefix="Message" field="message" errors={state.errors} />
                  <Button
                    type="submit"
                    disabled={state.submitting}
                    className="rounded-2xl bg-brand-sea border-brand-sea text-white"
                  >
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
