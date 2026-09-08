import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const SLUG = "how-much-alcohol-for-100-wedding-guests";
const PAGE_URL = `${SITE_URL}/blog/${SLUG}`;
const TITLE = "How Much Alcohol Do You Need for 100 Wedding Guests? | Rikki's Mobile Bar";
const DESCRIPTION =
  "A practical formula for estimating beer, wine, and liquor quantities for a 100-guest wedding hosted bar, plus how it scales to 150 guests.";

const faqs = [
  {
    q: "Does this formula change for a beer & wine only bar?",
    a: "Keep the same illustrative 300-serving budget if your guest assumptions are unchanged, then allocate it to beer and wine. A 50/50 split means 150 beers (7 cases of 24, rounded up) and 150 wine servings (30 bottles at five glasses per bottle). Adapt the split to your guests.",
  },
  {
    q: "What if some guests don't drink?",
    a: "Replace the example's 75 participating adults with your own expected count. Multiply that count by your agreed stock allowance, then allocate the total across your menu. Budget water and zero-proof drinks separately for everyone.",
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
            Start with the number of adults who expect to drink alcohol, rather than the total guest count.
            As an illustrative stock-planning scenario, suppose 75 of your 100 guests drink alcohol and you
            budget four servings per participating guest across the event: 75 × 4 = 300 servings.
            This is a purchasing example, not a recommendation for how much anyone should drink.
            With a menu split of 40% beer, 30% wine, and 30% cocktails, the calculation is:
          </p>

          <ul className="list-disc space-y-2 pl-5">
            <li><span className="font-semibold">Beer:</span> 120 servings = 5 cases of 24 cans or bottles.</li>
            <li><span className="font-semibold">Wine:</span> 90 servings ÷ approximately 5 glasses per 750ml bottle = 18 bottles, using 5-ounce pours.</li>
            <li><span className="font-semibold">Spirits:</span> 90 cocktails ÷ approximately 16 pours per 750ml bottle = 6 bottles rounded up, assuming 1.5 ounces of spirits per cocktail. Recipes using more spirits require more stock.</li>
            <li><span className="font-semibold">Water, zero-proof drinks, mixers & garnish:</span> plan these separately for all guests and your chosen recipes.</li>
          </ul>

          <h2 className="text-xl font-bold text-brand-ink">Scaling to 150 guests</h2>
          <p>
            For 150 guests with the same participation and menu assumptions, the stock budget is 450 servings:
            180 beers (8 cases rounded up), 135 glasses of wine (27 bottles), and 135 cocktails (9 bottles of
            spirits rounded up). Confirm the actual number of participating adults, recipes, and service hours
            with your bartender before ordering; adjust each category to your guests' preferences.
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
