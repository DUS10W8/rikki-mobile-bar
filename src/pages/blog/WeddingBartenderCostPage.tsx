import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const SLUG = "wedding-bartender-cost-washington";
const PAGE_URL = `${SITE_URL}/blog/${SLUG}/`;
const TITLE = "How Much Does a Wedding Bartender Cost in Washington? | Rikki's Mobile Bar";
const DESCRIPTION =
  "A realistic breakdown of wedding bartender and mobile bar pricing in Washington State, including what drives the cost per guest.";

const faqs = [
  {
    q: "What's a typical starting price for a wedding bar in Washington?",
    a: "Many Washington mobile bar and bartending companies start around $700-$1,000 as a base, then price per guest. Rikki's Mobile Bar events start at $800.",
  },
  {
    q: "Does the cost include alcohol?",
    a: "It depends on the vendor. Some bartenders charge a flat labor fee and require you to buy the alcohol separately (BYOB). Licensed vendors like Rikki's Mobile Bar can include alcohol purchasing in the package price.",
  },
  {
    q: "How can I lower my wedding bar cost without cutting the experience?",
    a: "Choose a beer & wine or limited hosted bar instead of full open bar, keep the bar open for a defined window rather than the whole event, and confirm your guest count early so staffing isn't overbuilt.",
  },
];

export default function WeddingBartenderCostPage() {
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
          { "@type": "ListItem", position: 3, name: "Wedding Bartender Cost", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "How Much Does a Wedding Bartender Cost in Washington?",
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Planning Guides", href: "/blog" }, { label: "Wedding Bartender Cost" }]} />

      <article className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Planning Guide</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">
          How Much Does a Wedding Bartender Cost in Washington?
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">Updated September 2026 &middot; Rikki's Mobile Bar</p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-brand-ink/85">
          <p>
            Wedding bar pricing in Washington varies more than most other line items on a wedding budget, mostly
            because "bartender" can mean very different things depending on the vendor. A bartender-for-hire who
            simply pours what you provide costs very differently than a licensed mobile bar that purchases the
            alcohol, brings the bar structure, and staffs the whole event.
          </p>

          <h2 className="text-xl font-bold text-brand-ink">The three things that drive wedding bar cost</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li><span className="font-semibold">Guest count.</span> Most vendors price bar service per guest once you're past a base minimum, since it directly determines pour volume and staffing.</li>
            <li><span className="font-semibold">Drink program.</span> A beer & wine bar costs less than a full cocktail bar, which costs less than a premium signature/mocktail program with elevated ingredients.</li>
            <li><span className="font-semibold">Whether alcohol purchasing is included.</span> A flat bartending fee that excludes alcohol looks cheaper up front, but you're still paying for the alcohol yourself &mdash; often at retail prices, with the added work of buying, transporting, and returning it.</li>
          </ol>

          <h2 className="text-xl font-bold text-brand-ink">What Rikki's Mobile Bar charges</h2>
          <p>
            Events start at $800, with most weddings landing in a per-guest range depending on the bar tier:
            roughly $16-$20 per guest for a beer & wine bar, $20-$26 per guest for a classic cocktail bar, and
            $26-$34 per guest for a premium signature/mocktail bar. That range includes licensed alcohol
            purchasing, professional bartenders, the vintage bar setup, drinkware, garnishes, and setup/breakdown.
            Duration and any event-tech add-ons (audio, DJ support, displays) adjust the total. See our{" "}
            <a href="/wedding-bartender-tri-cities-wa" className="font-semibold text-brand-sea hover:underline">wedding bartender page</a>{" "}
            for the full package breakdown, or request a live estimate directly.
          </p>

          <h2 className="text-xl font-bold text-brand-ink">Questions to ask any wedding bar vendor</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Is alcohol purchasing included, or is that on us?</li>
            <li>Is pricing per guest, flat rate, or hourly &mdash; and what happens if the event runs long?</li>
            <li>Is the bartender independently licensed to serve, and is the company licensed to purchase alcohol if that matters to us?</li>
            <li>What's included in setup: bar structure, drinkware, ice, garnishes?</li>
            <li>How many bartenders will be staffed for our guest count?</li>
          </ul>
        </div>
      </article>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="Keep planning"
        links={[
          { href: "/blog/how-much-alcohol-for-100-wedding-guests", label: "Alcohol for 100 Wedding Guests", desc: "A per-guest formula for beer, wine & liquor." },
          { href: "/blog/wedding-bar-checklist", label: "Wedding Bar Checklist", desc: "Everything to confirm before your wedding day." },
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "Our wedding bar packages and pricing." },
        ]}
      />

      <CtaBanner heading="Get a firm quote for your wedding date" body="Share your guest count and drink program preference for a live estimate." />
    </MarketingPage>
  );
}
