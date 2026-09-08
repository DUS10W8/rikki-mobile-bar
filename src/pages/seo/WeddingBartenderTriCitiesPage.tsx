import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { Card, CardContent } from "../../components/ui/card";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const PAGE_URL = `${SITE_URL}/wedding-bartender-tri-cities-wa`;
const TITLE = "Wedding Bartender in the Tri-Cities, WA | Rikki's Mobile Bar";
const DESCRIPTION =
  "Licensed wedding bartender service in Richland, Kennewick & Pasco. A vintage 1985 Club Wagon mobile bar with craft cocktails, beer, wine, and full alcohol purchasing.";

const faqs = [
  {
    q: "Do we need to buy our own alcohol?",
    a: "No. Rikki's Mobile Bar holds a Washington liquor license that allows us to purchase and serve alcohol directly for qualifying private events, so you don't have to shop, transport, or manage inventory yourself. See our licensed mobile bar page for details.",
  },
  {
    q: "What's included in wedding bartending service?",
    a: "Licensed alcohol purchasing, professional bartenders, the vintage Club Wagon bar setup, drinkware, garnishes and mixers, setup and breakdown, and coordination with your venue and planner. Add-ons like DJ/audio support are available for full-event coverage.",
  },
  {
    q: "Can we do a hosted bar, a cash bar, or a mix?",
    a: "Most Tri-Cities weddings we serve choose a fully hosted bar (you cover the tab, guests drink free) or a limited hosted bar (beer/wine hosted, spirits self-pay). We'll walk through hosted vs. cash bar structures when you request your quote.",
  },
  {
    q: "How many bartenders do we need for our guest count?",
    a: "As a rule of thumb, plan on one bartender per 75-100 guests for steady service without long lines. We staff based on your final guest count, drink program, and whether service is double-sided.",
  },
  {
    q: "Do you provide mocktails and non-alcoholic options?",
    a: "Yes. Every package can include intentional zero-proof drinks alongside the cocktail menu, not just soda and juice.",
  },
  {
    q: "What areas do you serve for weddings?",
    a: "Richland, Kennewick, Pasco, and the surrounding Tri-Cities area, with travel available to Walla Walla, Yakima, and other Eastern Washington venues.",
  },
  {
    q: "How much does a wedding bartender cost in the Tri-Cities?",
    a: "Rikki's Mobile Bar events start at $800, with most weddings priced per guest ($16-$34/guest depending on the bar tier) plus event length and any tech add-ons. Read our full wedding bartender cost breakdown for Washington for a deeper walkthrough.",
  },
];

export default function WeddingBartenderTriCitiesPage() {
  useDocumentHead({
    title: TITLE,
    description: DESCRIPTION,
    canonical: PAGE_URL,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Wedding Bartender Tri-Cities", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Wedding bartending service",
        name: "Wedding Bartender Service",
        provider: { "@type": "LocalBusiness", name: BUSINESS.name, telephone: BUSINESS.telephone, url: `${SITE_URL}/` },
        areaServed: [
          { "@type": "City", name: "Richland" },
          { "@type": "City", name: "Kennewick" },
          { "@type": "City", name: "Pasco" },
        ],
        description: DESCRIPTION,
        url: PAGE_URL,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : "" },
        })),
      },
    ],
  });

  return (
    <MarketingPage>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wedding Bartender Tri-Cities" }]} />

      <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Wedding Bartending</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
          Wedding Bartender Service in the Tri-Cities, WA
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
          A licensed mobile bar and bartending team for weddings in Richland, Kennewick, and Pasco &mdash; served
          from a restored 1985 Club Wagon so the bar becomes part of the day, not just a table with bottles on it.
        </p>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto grid max-w-4xl gap-8 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-ink">How wedding bar service works</h2>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed text-brand-ink/80 md:text-base">
              <li><span className="font-semibold text-brand-ink">1. Tell us about your day.</span> Date, venue, guest count, and event style &mdash; ceremony and reception together, reception only, or a rehearsal dinner.</li>
              <li><span className="font-semibold text-brand-ink">2. Choose a bar direction.</span> Beer & wine, classic cocktails, or a premium signature/mocktail program. We help you land on the right tier for your guest list.</li>
              <li><span className="font-semibold text-brand-ink">3. We handle the license, the alcohol, and the logistics.</span> Purchasing, permits, staffing, setup, and breakdown are ours to manage.</li>
              <li><span className="font-semibold text-brand-ink">4. You get to be a guest at your own wedding.</span> The team runs the bar from arrival through last call.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-ink">What you don't have to worry about</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-brand-ink/80 md:text-base">
              <li>Buying, transporting, or returning alcohol</li>
              <li>Finding and vetting a separately licensed bartender</li>
              <li>Renting glassware, ice, mixers, or a bar structure</li>
              <li>Coordinating a second vendor for setup and cleanup</li>
              <li>Figuring out hosted-bar math the week of your wedding</li>
            </ul>
            <p className="mt-4 text-sm text-brand-ink/70">
              Because Rikki's Mobile Bar is licensed to purchase alcohol directly, the process looks different from a
              typical BYOB bartender-for-hire. Read the full breakdown on our{" "}
              <a href="/licensed-mobile-bar-washington" className="font-semibold text-brand-sea hover:underline">
                licensed mobile bar service page
              </a>.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-chrome/70 bg-brand-primary/60 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">Hosted bar, cash bar, or a mix</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-brand-chrome bg-white">
              <CardContent className="p-5">
                <h3 className="font-bold text-brand-ink">Fully hosted</h3>
                <p className="mt-2 text-sm text-brand-ink/75">You cover the full bar tab and guests drink at no cost. Most common for Tri-Cities weddings.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-brand-chrome bg-white">
              <CardContent className="p-5">
                <h3 className="font-bold text-brand-ink">Limited hosted</h3>
                <p className="mt-2 text-sm text-brand-ink/75">Beer, wine, and select cocktails are hosted; premium spirits are self-pay. A popular middle ground.</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-brand-chrome bg-white">
              <CardContent className="p-5">
                <h3 className="font-bold text-brand-ink">Cash bar</h3>
                <p className="mt-2 text-sm text-brand-ink/75">Guests purchase their own drinks. Some Washington venues restrict cash bars &mdash; we'll help you confirm what your venue allows.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">Pricing starting points</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-ink/80 md:text-base">
            Wedding bar service starts at $800 and scales with your guest count, drink program, and event length.
            As a general guide, hosted bar programs run roughly $16-$20 per guest for beer & wine, $20-$26 per guest
            for a classic cocktail bar, and $26-$34 per guest for a premium signature/mocktail bar &mdash; before
            duration adjustments. Final pricing is confirmed once we know your date and guest count. For the full
            explanation of what drives wedding bar pricing across Washington, see our{" "}
            <a href="/blog/wedding-bartender-cost-washington" className="font-semibold text-brand-sea hover:underline">
              wedding bartender cost guide
            </a>.
          </p>
        </div>
      </section>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="Plan the rest of your bar"
        links={[
          { href: "/licensed-mobile-bar-washington", label: "Licensed Mobile Bar Service", desc: "How our Washington liquor license changes the planning process." },
          { href: "/mobile-bar-tri-cities-wa", label: "Tri-Cities Mobile Bar", desc: "Mobile bar service for weddings & private events in Richland, Kennewick & Pasco." },
          { href: "/blog/how-much-alcohol-for-100-wedding-guests", label: "Alcohol for 100 Wedding Guests", desc: "A practical planning formula for hosted bars." },
          { href: "/blog/wedding-bar-checklist", label: "Wedding Bar Checklist", desc: "Everything to confirm before your wedding day." },
        ]}
      />

      <CtaBanner
        heading="Check availability for your wedding date"
        body="Share your date, venue, and guest count. We'll confirm availability and send a live estimate in about two minutes."
      />
    </MarketingPage>
  );
}
