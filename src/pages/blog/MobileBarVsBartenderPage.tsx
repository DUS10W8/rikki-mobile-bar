import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const SLUG = "mobile-bar-vs-bartender";
const PAGE_URL = `${SITE_URL}/blog/${SLUG}`;
const TITLE = "Mobile Bar vs. Traditional Bartender: What's the Difference? | Rikki's Mobile Bar";
const DESCRIPTION =
  "Comparing a licensed mobile bar to hiring a traditional bartender-for-hire — what each includes, who buys the alcohol, and which fits your event.";

const faqs = [
  {
    q: "Is a mobile bar always more expensive than a bartender-for-hire?",
    a: "Not necessarily. A bartender-for-hire's flat fee looks lower, but you'll separately pay for alcohol, bar rentals, and often glassware. Once those are added up, total cost is often similar or lower with a licensed mobile bar.",
  },
  {
    q: "Can a traditional bartender legally buy alcohol for my event?",
    a: "In most cases, an independent bartender-for-hire is licensed to serve, not to purchase alcohol on your behalf — that's typically the host's responsibility unless the company itself holds a liquor license.",
  },
  {
    q: "Which option is better for a small backyard party?",
    a: "Both can work. A mobile bar adds a visual centerpiece and full-service convenience; a bartender-for-hire can be a lighter-weight option if you already have alcohol, glassware, and a bar space sorted out.",
  },
];

export default function MobileBarVsBartenderPage() {
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
          { "@type": "ListItem", position: 3, name: "Mobile Bar vs. Traditional Bartender", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "Mobile Bar vs. Traditional Bartender: What's the Difference?",
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Planning Guides", href: "/blog" }, { label: "Mobile Bar vs. Bartender" }]} />

      <article className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Planning Guide</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">
          Mobile Bar vs. Traditional Bartender: What's the Difference?
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60">Updated September 2026 &middot; Rikki's Mobile Bar</p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-brand-ink/85">
          <p>
            "Bartender" and "mobile bar" get used interchangeably in wedding planning, but they usually describe
            two different services. Knowing the difference helps you compare quotes accurately instead of
            comparing a flat labor fee to a full-service package.
          </p>

          <h2 className="text-xl font-bold text-brand-ink">A traditional bartender-for-hire typically provides</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>A licensed individual to pour and serve at your event</li>
            <li>Basic bar tools (shaker, jigger, strainer)</li>
            <li>Service for a set number of hours</li>
          </ul>
          <p>
            You're usually responsible for the alcohol itself, a bar table or structure, ice, mixers, garnish, and
            glassware or cups &mdash; either providing them yourself or renting separately.
          </p>

          <h2 className="text-xl font-bold text-brand-ink">A licensed mobile bar typically provides</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Alcohol purchasing (when the company holds a liquor license, like Rikki's Mobile Bar)</li>
            <li>The physical bar structure and presentation &mdash; in our case, a restored 1985 Club Wagon</li>
            <li>Bartending staff, drinkware, garnish, and mixers</li>
            <li>Setup, service, and breakdown as one coordinated package</li>
          </ul>

          <h2 className="text-xl font-bold text-brand-ink">Which one fits your event?</h2>
          <p>
            If you already have alcohol sourced, a bar structure rented, and just need pouring labor, a
            bartender-for-hire can work well. If you'd rather have one vendor handle purchasing, setup, and service
            end to end &mdash; and want the bar itself to be part of the guest experience &mdash; a licensed mobile
            bar is built for that. Read more about how licensing changes the planning process on our{" "}
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
          { href: "/licensed-mobile-bar-washington", label: "Licensed Mobile Bar Service", desc: "What our Washington liquor license includes." },
          { href: "/blog/wedding-bartender-cost-washington", label: "Wedding Bartender Cost in Washington", desc: "What drives wedding bar pricing." },
          { href: "/mobile-bar-tri-cities-wa", label: "Tri-Cities Mobile Bar", desc: "Mobile bar service in Richland, Kennewick & Pasco." },
        ]}
      />

      <CtaBanner />
    </MarketingPage>
  );
}
