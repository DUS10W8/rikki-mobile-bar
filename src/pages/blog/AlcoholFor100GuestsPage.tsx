import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const SLUG = "how-much-alcohol-for-100-wedding-guests";
const PAGE_URL = `${SITE_URL}/blog/${SLUG}/`;
const TITLE = "How Much Alcohol Do You Need for 100 Wedding Guests? | Rikki's Mobile Bar";
const DESCRIPTION =
  "A practical formula for estimating beer, wine, and liquor quantities for a 100-guest wedding hosted bar, plus how it scales to 150 guests.";

const faqs = [
  {
    q: "Does this formula change for a beer & wine only bar?",
    a: "Yes — drop the liquor line and shift some of that volume to beer and wine. A beer & wine only bar for 100 guests typically needs roughly 8-9 cases of beer and 30-35 bottles of wine over a 4-hour reception.",
  },
  {
    q: "What if some guests don't drink?",
    a: "This formula already assumes a realistic mix of drinkers and non-drinkers at a typical wedding. If you expect an unusually high or low percentage of non-drinking guests, adjust total volume up or down by roughly 10-15%.",
  },
  {
    q: "Is it cheaper to buy alcohol myself or use a licensed bar?",
    a: "Buying it yourself can look cheaper on paper, but you're taking on purchasing, transport, storage, and leftover risk. A licensed mobile bar folds purchasing into the package and buys to the quantities your event actually needs.",
  },
];

export default function AlcoholFor100GuestsPage() {
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
          { "@type": "ListItem", position: 2, name: "Planning Guides", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "Alcohol for 100 Wedding Guests", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "How Much Alcohol Do You Need for 100 Wedding Guests?",
        description: DESCRIPTION,
        author: { "@type": "Organization", name: BUSINESS.name },
        publisher: { "@type": "Organization", name: BUSINESS.name },
        datePublished: "2026-09-01",
        mainEntityOfPage: PAGE_URL,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  });

  return (
    <MarketingPage>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Planning Guides", href: "/blog" }, { label: "Alcohol for 100 Wedding Guests" }]} />

      <article className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Planning Guide</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">
          How Much Alcohol Do You Need for 100 Wedding Guests?
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">Updated September 2026 &middot; Rikki's Mobile Bar</p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-brand-ink/85">
          <p>
            A common industry rule of thumb is one drink per guest, per hour, for the first two hours, then roughly
            one drink per guest per hour after that, with about 60% of guests choosing beer or wine and 40%
            choosing liquor-based cocktails. For a 100-guest wedding with a typical 4-hour hosted bar, that works
            out to approximately:
          </p>

          <ul className="list-disc space-y-2 pl-5">
            <li><span className="font-semibold">Beer:</span> roughly 10-12 cases (24-can/bottle cases)</li>
            <li><span className="font-semibold">Wine:</span> roughly 35-40 bottles (mix of red and white)</li>
            <li><span className="font-semibold">Liquor:</span> roughly 10-12 bottles (750ml) across your core cocktail spirits</li>
            <li><span className="font-semibold">Mixers & garnish:</span> plan for 2-3 mixers per liquor type, plus citrus and garnish for signature cocktails</li>
          </ul>

          <h2 className="text-xl font-bold text-brand-ink">Scaling to 150 guests</h2>
          <p>
            For 150 guests under the same assumptions, scale each line up by roughly 1.5x: about 15-18 cases of
            beer, 50-60 bottles of wine, and 15-18 bottles of liquor for a 4-hour hosted bar. Longer receptions
            (5-6 hours) should add another 15-25% across the board.
          </p>

          <h2 className="text-xl font-bold text-brand-ink">Why this is only a starting point</h2>
          <p>
            Guest demographics, time of year, whether it's an afternoon or evening event, and your specific drink
            menu all shift these numbers. This is exactly the kind of planning that a licensed mobile bar handles
            for you &mdash; we build quantities around your actual guest count and drink program rather than a
            generic formula, so you're not over-buying or running short mid-reception. Read more about how that
            works on our{" "}
            <a href="/licensed-mobile-bar-washington" className="font-semibold text-brand-sea hover:underline">
              licensed mobile bar service page
            </a>.
          </p>
        </div>
      </article>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="Keep planning"
        links={[
          { href: "/blog/wedding-bartender-cost-washington", label: "Wedding Bartender Cost in Washington", desc: "What drives wedding bar pricing." },
          { href: "/blog/wedding-bar-checklist", label: "Wedding Bar Checklist", desc: "Everything to confirm before your wedding day." },
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "Our wedding bar packages and pricing." },
        ]}
      />

      <CtaBanner heading="Skip the spreadsheet" body="Tell us your guest count and we'll handle the quantities, purchasing, and service." />
    </MarketingPage>
  );
}
