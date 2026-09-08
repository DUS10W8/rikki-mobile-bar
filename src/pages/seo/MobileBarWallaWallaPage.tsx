import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const PAGE_URL = `${SITE_URL}/mobile-bar-walla-walla-wa`;
const TITLE = "Mobile Bar & Wedding Bartender in Walla Walla, WA | Rikki's Mobile Bar";
const DESCRIPTION =
  "Licensed mobile bar and wedding bartending for Walla Walla, WA wine-country events. A vintage 1985 Club Wagon bar with cocktails, beer & wine service.";

const faqs = [
  {
    q: "Do you travel to Walla Walla for weddings?",
    a: "Yes. Walla Walla is a core secondary market for us and a common pairing with our Tri-Cities wedding clients who choose a wine-country venue.",
  },
  {
    q: "Can the mobile bar work at a vineyard or winery venue?",
    a: "Yes, with vehicle access and a reasonably level setup area. Many Walla Walla venues are used to hosting outside vendors, and we coordinate load-in directly with venue staff or your planner.",
  },
  {
    q: "Is there a travel fee for Walla Walla events?",
    a: "Travel is factored into your quote based on distance from the Tri-Cities. Ask for exact travel pricing when you request your quote.",
  },
  {
    q: "Can you build a wine-forward drink menu for a Walla Walla wedding?",
    a: "Yes. In wine country, many couples pair a full bar with a curated wine list alongside cocktails and beer &mdash; we'll help you plan a menu that fits the setting.",
  },
];

export default function MobileBarWallaWallaPage() {
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
          { "@type": "ListItem", position: 2, name: "Walla Walla Mobile Bar", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Mobile bar & wedding bartending service",
        name: "Walla Walla Mobile Bar Service",
        provider: { "@type": "LocalBusiness", name: BUSINESS.name, telephone: BUSINESS.telephone, url: `${SITE_URL}/` },
        areaServed: { "@type": "City", name: "Walla Walla", containedInPlace: "Washington" },
        description: DESCRIPTION,
        url: PAGE_URL,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  return (
    <MarketingPage>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Walla Walla Mobile Bar" }]} />

      <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Wine Country Service</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
          Mobile Bar & Wedding Bartender in Walla Walla, WA
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
          Licensed bar service for Walla Walla weddings and wine-country events, brought to your venue in a
          restored 1985 Club Wagon &mdash; from the Tri-Cities team that already knows the drive.
        </p>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto max-w-3xl px-5 space-y-5 text-sm leading-relaxed text-brand-ink/80 md:text-base">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink">Built for wine-country events</h2>
          <p>
            Walla Walla weddings often mean vineyard views, outdoor ceremonies, and venues that are used to
            coordinating multiple outside vendors. Our vintage bar setup was built for exactly that: a
            photo-worthy centerpiece that also runs a fast, professional bar line for guests moving between
            ceremony, cocktail hour, and reception.
          </p>
          <p>
            Because Rikki's Mobile Bar holds a Washington liquor license, alcohol purchasing is part of the
            package &mdash; no need to source spirits, beer, or wine separately from a Walla Walla retailer or
            transport it yourself. See our{" "}
            <a href="/licensed-mobile-bar-washington" className="font-semibold text-brand-sea hover:underline">
              licensed mobile bar service page
            </a>{" "}
            for the full explanation.
          </p>
          <p>
            Many Walla Walla clients also want a bar program that complements the region's wine culture &mdash; we
            can build a menu around a featured wine list, classic cocktails, or a full beer/wine/cocktail spread
            depending on your event style.
          </p>
        </div>
      </section>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="More planning resources"
        links={[
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "Our core wedding bar packages, pricing, and FAQs." },
          { href: "/mobile-bar-tri-cities-wa", label: "Tri-Cities Mobile Bar", desc: "Mobile bar service in Richland, Kennewick & Pasco." },
          { href: "/blog/wedding-bar-checklist", label: "Wedding Bar Checklist", desc: "Everything to confirm before your wedding day." },
        ]}
      />

      <CtaBanner
        heading="Check availability for your Walla Walla event"
        body="Share your date, venue, and guest count. We'll confirm travel and send a live estimate."
      />
    </MarketingPage>
  );
}
