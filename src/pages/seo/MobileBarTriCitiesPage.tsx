import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const PAGE_URL = `${SITE_URL}/mobile-bar-tri-cities-wa`;
const TITLE = "Mobile Bar in the Tri-Cities, WA (Richland, Kennewick, Pasco) | Rikki's Mobile Bar";
const DESCRIPTION =
  "Licensed mobile bar service across the Tri-Cities — Richland, Kennewick & Pasco, WA. A vintage 1985 Club Wagon bar for weddings, corporate events, and private parties.";

const faqs = [
  {
    q: "Do you travel to Richland, Kennewick, and Pasco?",
    a: "Yes, all three cities are inside our core Tri-Cities service area with no travel fee. West Richland, Finley, and Burbank are also covered as part of standard service.",
  },
  {
    q: "What kinds of events do you serve in the Tri-Cities?",
    a: "Weddings, corporate parties, grand openings, birthdays, bridal showers, backyard gatherings, and private dinners — anywhere a licensed, professionally staffed bar makes the event easier to host.",
  },
  {
    q: "Can you set up outdoors along the Columbia River or at a winery?",
    a: "Yes. The van and bar setup work well for riverside parks, backyard properties, and vineyard-style venues throughout Benton and Franklin counties, as long as there's vehicle access and a reasonably level surface.",
  },
  {
    q: "Is alcohol included, or do we need to provide our own?",
    a: "Alcohol purchasing is included with every bar package thanks to our Washington liquor license — no BYOB shopping trip required. Learn more on our licensed mobile bar page.",
  },
];

export default function MobileBarTriCitiesPage() {
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
          { "@type": "ListItem", position: 2, name: "Tri-Cities Mobile Bar", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Mobile bar service",
        name: "Tri-Cities Mobile Bar Service",
        provider: { "@type": "LocalBusiness", name: BUSINESS.name, telephone: BUSINESS.telephone, url: `${SITE_URL}/` },
        areaServed: [
          { "@type": "City", name: "Richland", containedInPlace: "Washington" },
          { "@type": "City", name: "Kennewick", containedInPlace: "Washington" },
          { "@type": "City", name: "Pasco", containedInPlace: "Washington" },
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
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  return (
    <MarketingPage>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tri-Cities Mobile Bar" }]} />

      <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Mobile Bar Service</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
          Mobile Bar Service in the Tri-Cities, WA
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
          Licensed bar service from a restored 1985 Club Wagon, based in and around Richland, Kennewick, and Pasco
          &mdash; built for weddings, corporate events, and private parties across the Mid-Columbia.
        </p>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 md:grid-cols-3">
          <div className="rounded-2xl border border-brand-chrome bg-brand-primary/40 p-5">
            <h2 className="text-lg font-bold text-brand-ink">Richland</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink/78">
              From riverfront properties along the Columbia to backyard weddings near Horn Rapids, Richland hosts
              some of the Tri-Cities' most scenic outdoor events. We plan around venue access, generator needs, and
              afternoon heat for a smooth pour from cocktail hour through the reception.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-chrome bg-brand-primary/40 p-5">
            <h2 className="text-lg font-bold text-brand-ink">Kennewick</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink/78">
              Kennewick's mix of banquet halls, event centers, and private residences means bar setups range from a
              simple indoor corner to a full outdoor build. We coordinate directly with venue staff on load-in
              windows, power, and any venue-specific alcohol policies.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-chrome bg-brand-primary/40 p-5">
            <h2 className="text-lg font-bold text-brand-ink">Pasco</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink/78">
              For Pasco weddings and community events, we plan bar placement around guest flow and, for larger
              gatherings, staff to a second station so service stays fast even at 200+ guest events.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-chrome/70 bg-brand-primary/60 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">What a Tri-Cities mobile bar actually provides</h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-ink/80 md:text-base">
            A mobile bar is more than a bartender-for-hire: it's the licensed alcohol purchasing, the physical bar
            structure, the drinkware and garnish program, setup and breakdown, and a team that manages the whole
            beverage side of your event so no other vendor has to. That's the difference between a mobile bar and a
            traditional bartender &mdash; covered in more detail in our{" "}
            <a href="/blog/mobile-bar-vs-bartender" className="font-semibold text-brand-sea hover:underline">
              mobile bar vs. traditional bartender guide
            </a>.
          </p>
        </div>
      </section>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="Planning a wedding instead?"
        links={[
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "Wedding-specific bar packages, hosted vs. cash bar, and pricing." },
          { href: "/licensed-mobile-bar-washington", label: "Licensed Mobile Bar Service", desc: "How our Washington liquor license simplifies alcohol purchasing." },
          { href: "/mobile-bar-walla-walla-wa", label: "Walla Walla Mobile Bar", desc: "Wine-country events in Walla Walla and the surrounding valley." },
          { href: "/blog", label: "Planning Guides", desc: "Cost breakdowns, alcohol calculators, and bar checklists." },
        ]}
      />

      <CtaBanner />
    </MarketingPage>
  );
}
