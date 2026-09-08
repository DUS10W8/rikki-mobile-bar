import MarketingPage, { Breadcrumbs, CtaBanner, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const PAGE_URL = `${SITE_URL}/licensed-mobile-bar-washington`;
const TITLE = "Licensed Mobile Bar Service in Washington | Rikki's Mobile Bar";
const DESCRIPTION =
  "Rikki's Mobile Bar holds a Washington liquor license, so we can purchase and serve alcohol directly for qualifying private events — no BYOB shopping required.";

const faqs = [
  {
    q: "What does 'licensed mobile bar' mean?",
    a: "It means Rikki's Mobile Bar holds a Washington state liquor license that allows our team to purchase alcohol on your behalf and serve it at your private event, rather than requiring you to buy alcohol yourself and hand it to a bartender.",
  },
  {
    q: "How is this different from a BYOB bartender?",
    a: "A BYOB bartender-for-hire can pour and serve, but you're responsible for purchasing, transporting, and often returning unused alcohol. With a licensed mobile bar, we handle sourcing and purchasing as part of your bar package.",
  },
  {
    q: "Do you handle the alcohol purchasing for every event?",
    a: "Alcohol purchasing is built into our standard bar packages for qualifying private events. We finalize the exact drink menu and quantities with you before the event based on your guest count and chosen bar tier.",
  },
  {
    q: "Are there events or situations where licensing doesn't apply?",
    a: "Licensing requirements can vary by event type, venue, and local rules. We'll flag anything venue- or event-specific during your booking so there are no surprises before your event date.",
  },
  {
    q: "Does the license cover beer, wine, and spirits?",
    a: "Our bar packages are built around beer, wine, and mixed cocktails using standard spirits. Tell us your event style when requesting a quote and we'll confirm what's included in your tier.",
  },
];

export default function LicensedMobileBarPage() {
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
          { "@type": "ListItem", position: 2, name: "Licensed Mobile Bar Service", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Licensed alcohol purchasing and bartending",
        name: "Licensed Mobile Bar Service",
        provider: { "@type": "LocalBusiness", name: BUSINESS.name, telephone: BUSINESS.telephone, url: `${SITE_URL}/` },
        areaServed: { "@type": "State", name: "Washington" },
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Licensed Mobile Bar Service" }]} />

      <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Licensed Service</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
          Licensed Mobile Bar Service in Washington
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
          Rikki's Mobile Bar holds a Washington liquor license, which lets our team purchase and serve alcohol
          directly for qualifying private events &mdash; one of the clearest differences between us and a typical
          BYOB bartender-for-hire.
        </p>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink">What the license changes for you</h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-ink/80 md:text-base">
            With a BYOB service, the host typically purchases the beverages. For qualifying events, Rikki's
            handles alcohol purchasing as part of the agreed bar package. We confirm the service arrangement
            with you and your venue before booking. In plain terms, that means:
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-brand-ink/80 md:text-base">
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>You don't make a liquor store run, guess at quantities, or manage leftover bottles.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>We plan the drink menu and quantities with you, then purchase to match your guest count and bar tier.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>Alcohol purchasing, bartending, and service are handled by one team instead of split across you and a vendor.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>It's one less thing to coordinate the week of your event.</span></li>
          </ul>
        </div>
      </section>

      <section className="border-t border-brand-chrome/70 bg-brand-primary/60 py-14">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">Licensed service vs. BYOB bartending</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-chrome bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-primary/70 text-xs uppercase tracking-wide text-brand-ink/70">
                <tr>
                  <th className="px-4 py-3">&nbsp;</th>
                  <th className="px-4 py-3">Rikki's Mobile Bar</th>
                  <th className="px-4 py-3">Typical BYOB bartender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-chrome/60">
                <tr>
                  <td className="px-4 py-3 font-semibold">Buys the alcohol</td>
                  <td className="px-4 py-3">Included</td>
                  <td className="px-4 py-3">Host's responsibility</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Transports & manages leftovers</td>
                  <td className="px-4 py-3">Included</td>
                  <td className="px-4 py-3">Host's responsibility</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Provides bar structure & setup</td>
                  <td className="px-4 py-3">Included (vintage Club Wagon bar)</td>
                  <td className="px-4 py-3">Varies by vendor</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Pours & serves at your event</td>
                  <td className="px-4 py-3">Included</td>
                  <td className="px-4 py-3">Included</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-brand-ink/60">
            This comparison describes typical BYOB bartending arrangements in the region and is intended as general
            planning guidance, not a legal statement about any specific vendor.
          </p>
        </div>
      </section>

      <FaqSection items={faqs} />

      <RelatedLinks
        heading="See it in action"
        links={[
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "How licensed service fits into wedding bar planning." },
          { href: "/mobile-bar-tri-cities-wa", label: "Tri-Cities Mobile Bar", desc: "Mobile bar service across Richland, Kennewick & Pasco." },
          { href: "/blog/mobile-bar-vs-bartender", label: "Mobile Bar vs. Traditional Bartender", desc: "A closer look at what each option actually provides." },
        ]}
      />

      <CtaBanner
        heading="Ask about licensed service for your event"
        body="Tell us your event date and guest count and we'll confirm what's included for your bar tier."
      />
    </MarketingPage>
  );
}
