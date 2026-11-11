import { QrCode, CreditCard, BellRing, Martini, Footprints } from "lucide-react";
import MarketingPage, { Breadcrumbs, FaqSection, RelatedLinks } from "../../components/layout/MarketingPage";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { BookingFlow } from "../../booking/BookingFlow";
import { useDocumentHead, SITE_URL, BUSINESS } from "../../lib/seo";

const BASE = import.meta.env.BASE_URL;
const PAGE_URL = `${SITE_URL}/order-from-your-seat`;
const VIDEO_URL = `${SITE_URL}/social/order-from-your-seat.mp4`;
const POSTER_URL = `${SITE_URL}/social/order-from-your-seat-poster.jpg`;
const TITLE = "QR Code Drink Ordering for Events in the Tri-Cities | Rikki's Mobile Bar";
const DESCRIPTION =
  "Guests scan a QR code, order and pay on their phone, and get a live status until the drink is ready or walked to them. Order-from-your-seat bar service from Rikki's Mobile Bar.";

const steps = [
  {
    icon: QrCode,
    title: "Scan",
    body: "Guests scan a QR code on a table sign. Your event's drink menu opens in their phone's browser. There is no app to download.",
  },
  {
    icon: Martini,
    title: "Pick",
    body: "They choose a drink, add their name, and choose where to get it: at the bar, or handed off by a runner at a spot we agree with you beforehand.",
  },
  {
    icon: CreditCard,
    title: "Pay",
    body: "Checkout runs through Square with Apple Pay, Google Pay, or a card. The order only reaches the bartender once Square confirms the payment.",
  },
  {
    icon: BellRing,
    title: "Follow along",
    body: "The guest's phone shows a live status: order received, in the queue, being made, then ready or on the way. Nobody has to stand at the bar and wait.",
  },
  {
    icon: Footprints,
    title: "Pick up or get it handed off",
    body: "They walk up when the status says ready, or meet our runner at the handoff spot. The status flips to delivered when the drink is in their hand.",
  },
];

const fits = [
  {
    title: "The bar can't come inside",
    body: "Upper floors, tight rooms, and venues where a vehicle has to stay in the lot. The van parks where it fits and the orders come to it.",
  },
  {
    title: "Guests are busy with something else",
    body: "Open houses, vendor fairs, classes, and showcases where people don't want to leave their seat, booth, or appointment to queue.",
  },
  {
    title: "You want a shorter line",
    body: "Orders arrive at the bar already paid and in order, so the bartender makes drinks instead of running a register.",
  },
];

const faqs = [
  {
    q: "Do guests need to download an app?",
    a: "No. The QR code opens a web page in the phone's browser. Any recent iPhone or Android phone works.",
  },
  {
    q: "How do guests pay?",
    a: "Through Square's hosted checkout, using Apple Pay, Google Pay, or a card. An order is released to the bartender only after Square confirms a completed payment for the right amount.",
  },
  {
    q: "How do guests know their drink is ready?",
    a: "The page they ordered from turns into a live tracker with their order number. It updates on its own as the drink moves from the queue to being made to ready or on the way, and they can switch on a sound alert.",
  },
  {
    q: "Can drinks be brought to guests?",
    a: "Yes, to a handoff spot. Guests choose between picking up at the bar and meeting a runner at a location we set with you and the venue ahead of time, such as a doorway or the top of a stairway. We also agree how alcohol service works at that spot before the event.",
  },
  {
    q: "Can people still just walk up and order?",
    a: "Yes. Walk-up orders go into the same queue, and guests can tap to pay at the bar.",
  },
  {
    q: "Is the menu specific to my event?",
    a: "Yes. Each event gets its own drink menu and prices on the ordering page, including alcohol-free options.",
  },
  {
    q: "Does QR ordering work for a hosted bar?",
    a: "It is built for events where guests buy their own drinks. If you are hosting the bar and still want guests to order from their seats, tell us in your quote request and we'll talk through what fits.",
  },
  {
    q: "How do I add it to my event?",
    a: "Mention order-from-your-seat service when you request a quote. We'll confirm whether your venue and guest count suit it and include it in your estimate.",
  },
];

export default function OrderFromYourSeatPage() {
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
          { "@type": "ListItem", position: 2, name: "Order From Your Seat", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "QR code drink ordering for events",
        name: "Order-From-Your-Seat Bar Service",
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
        "@type": "VideoObject",
        name: "Ordering a drink from the second floor at a Rikki's Mobile Bar event",
        description:
          "A guest scans a QR code upstairs, orders and pays on their phone, and the drink is made at the van outside and walked up to the doorway.",
        thumbnailUrl: [POSTER_URL],
        contentUrl: VIDEO_URL,
        uploadDate: "2026-11-10T00:00:00-08:00",
        duration: "PT37S",
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
    <MarketingPage quoteHref="#book">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order From Your Seat" }]} />

      {/* Hero: the claim and the film that proves it */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-12 pt-8 md:grid-cols-[1.15fr_0.85fr] md:pt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Order from your seat</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
            QR code drink ordering for your event
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
            Guests scan a code, order and pay on their phone, and watch a live status until their drink is ready or
            walked to them. Our bar is a 1985 van, so it can't always come inside. The ordering can.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a href="#book">
              <Button className="chrome-button w-full rounded-2xl border-brand-sea bg-brand-sea text-white sm:w-auto" size="lg">
                Get a Quote
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="outline" className="w-full rounded-2xl border-brand-ink/25 bg-white sm:w-auto" size="lg">
                See how it works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-brand-ink/60">
            Serving Richland, Kennewick, Pasco and nearby. Call or text {BUSINESS.telephoneDisplay}.
          </p>
        </div>

        <figure className="mx-auto w-full max-w-[320px]">
          <div className="overflow-hidden rounded-[2rem] border border-brand-chrome bg-brand-ink shadow-[0_24px_70px_rgba(20,20,20,0.18)]">
            <video
              className="block aspect-[9/16] w-full"
              controls
              playsInline
              preload="none"
              poster={`${BASE}social/order-from-your-seat-poster.jpg`}
              aria-label="Film: a guest orders a drink from the second floor and it is walked up from the van outside"
            >
              <source src={`${BASE}social/order-from-your-seat.mp4`} type="video/mp4" />
            </video>
          </div>
          <figcaption className="mt-3 text-center text-xs text-brand-ink/60">
            A real order at a Tri-Cities event: placed upstairs, made at the van, walked to the doorway. 37 seconds.
          </figcaption>
        </figure>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">
            From scan to sip, without leaving the room
          </h2>
          <ol className="mt-8 space-y-5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-brand-chrome bg-brand-primary/50 text-brand-sea">
                  <step.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink md:text-lg">
                    <span className="text-brand-ink/45">{i + 1}.</span> {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-ink/78 md:text-base">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Where it fits */}
      <section className="border-t border-brand-chrome/70 bg-brand-primary/60 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">Where it earns its keep</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {fits.map((fit) => (
              <Card key={fit.title} className="rounded-2xl border-brand-chrome bg-white shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-brand-ink">{fit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink/75">{fit.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What the host gets */}
      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">What you get as the host</h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-brand-ink/80 md:text-base">
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>Printed QR signs for your tables or front desk, and an ordering page with your event's name and menu.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>The same licensed bar team and drinks as any Rikki's event. The ordering is how guests reach us, not a replacement for the bar.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>A runner for handoffs when the bar and the guests are in different places.</span></li>
            <li className="flex gap-3"><span className="font-bold text-brand-sea">&bull;</span><span>Nothing for you to set up or manage. We built the ordering system ourselves and run it on the day.</span></li>
          </ul>
        </div>
      </section>

      <FaqSection items={faqs} />

      {/* Quote form, on the page so a viewer never has to leave it */}
      <section id="book" className="scroll-mt-20 border-t border-brand-chrome/70 bg-[linear-gradient(180deg,#ffffff_0%,#f3ece2_100%)] py-14 pb-24 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold leading-tight text-brand-ink md:text-4xl">
              Check your date and build a live estimate
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-brand-ink/80 md:text-lg">
              About two minutes, no payment required. Mention order-from-your-seat service in your details and we'll
              include it when we confirm your quote.
            </p>
          </div>
          <BookingFlow formspreeId="xgvgzrnn" />
        </div>
      </section>

      <RelatedLinks
        heading="More about the bar"
        links={[
          { href: "/mobile-bar-tri-cities-wa", label: "Tri-Cities Mobile Bar", desc: "Mobile bar service across Richland, Kennewick & Pasco." },
          { href: "/licensed-mobile-bar-washington", label: "Licensed Alcohol Service", desc: "How our Washington liquor license changes what we can do for you." },
          { href: "/wedding-bartender-tri-cities-wa", label: "Wedding Bartender Tri-Cities", desc: "Bar planning and service for weddings." },
          { href: "/blog/mobile-bar-vs-bartender", label: "Mobile Bar vs. Traditional Bartender", desc: "What each option actually provides." },
        ]}
      />
    </MarketingPage>
  );
}
