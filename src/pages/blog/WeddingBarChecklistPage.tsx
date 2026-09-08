import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const SLUG = "wedding-bar-checklist";
const PAGE_URL = `${SITE_URL}/blog/${SLUG}`;
const TITLE = "Wedding Bar Checklist: Everything You Need | Rikki's Mobile Bar";
const DESCRIPTION =
  "A step-by-step wedding bar planning checklist covering licensing, guest count, quantities, staffing, and venue rules for Washington weddings.";

const checklist = [
  { step: "6-9 months out", items: ["Confirm your venue's alcohol policy (in-house bar required? outside vendors allowed? cash bar restrictions?)", "Decide hosted, limited hosted, or cash bar", "Get quotes from bar vendors and compare what's actually included"] },
  { step: "3-4 months out", items: ["Book your bar vendor and confirm the contract", "Finalize your guest count estimate", "Choose your bar tier (beer & wine, classic cocktail, or premium/mocktail)"] },
  { step: "6-8 weeks out", items: ["Finalize signature cocktails or must-have drinks", "Confirm bar placement and setup logistics with your venue", "Confirm any event-tech needs (audio, lighting) that touch the bar area"] },
  { step: "2 weeks out", items: ["Lock in final guest count for staffing and quantities", "Confirm start/end time for bar service", "Share day-of contact info between your planner and bar vendor"] },
  { step: "Day of", items: ["Confirm load-in time and access with your venue", "Walk the bar team through timeline (cocktail hour, toasts, last call)", "Enjoy the party — this is the point of hiring it out"] },
];

const faqs = [
  {
    q: "Do I need a bartender for my wedding, or can a friend pour drinks?",
    a: "You can have a friend serve casually for a small, low-key gathering, but most venues require a licensed bartender for insurance and liability reasons, and a licensed vendor is the only way to have alcohol purchasing included.",
  },
  {
    q: "What's the single most common wedding bar mistake?",
    a: "Not confirming the venue's alcohol policy early. Some venues require an in-house bar, restrict outside alcohol, or prohibit cash bars — find this out before you book a vendor.",
  },
];

export default function WeddingBarChecklistPage() {
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
          { "@type": "ListItem", position: 3, name: "Wedding Bar Checklist", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "Wedding Bar Checklist: Everything You Need",
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Planning Guides", href: "/blog" }, { label: "Wedding Bar Checklist" }]} />

      <article className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Planning Guide</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">
          Wedding Bar Checklist: Everything You Need
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">Updated September 2026 &middot; Rikki's Mobile Bar</p>

        <p className="mt-8 text-base leading-relaxed text-brand-ink/85">
          Here's the order most Washington couples plan their wedding bar in, from first venue conversations to
          the day itself.
        </p>

        <div className="mt-8 space-y-6">
          {checklist.map((group) => (
            <div key={group.step} className="rounded-2xl border border-brand-chrome bg-brand-primary/40 p-5">
              <h2 className="text-lg font-bold text-brand-ink">{group.step}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-ink/80 md:text-base">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-base leading-relaxed text-brand-ink/85">
          If you'd rather hand off the logistics entirely, a licensed mobile bar folds most of this checklist into
          one booking &mdash; see how that works on our{" "}
          <a href="/wedding-bartender-tri-cities-wa" className="font-semibold text-brand-sea hover:underline">
            wedding bartender page
          </a>.
        </p>
      </article>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="Keep planning"
        links={[
          { href: "/blog/how-much-alcohol-for-100-wedding-guests", label: "Alcohol for 100 Wedding Guests", desc: "A per-guest formula for beer, wine & liquor." },
          { href: "/blog/wedding-bartender-cost-washington", label: "Wedding Bartender Cost in Washington", desc: "What drives wedding bar pricing." },
          { href: "/licensed-mobile-bar-washington", label: "Licensed Mobile Bar Service", desc: "What our Washington liquor license includes." },
        ]}
      />

      <CtaBanner heading="Check availability for your date" body="We'll walk through this checklist with you when you request a quote." />
    </MarketingPage>
  );
}
