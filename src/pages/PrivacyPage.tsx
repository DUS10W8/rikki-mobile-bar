/**
 * Dev / non-static hosting: simple legal layout (no accordions, no client-only legal text).
 * Production (GitHub Pages): `npm run build` writes crawler-first static HTML via scripts/compliance-pages.mjs — keep wording in sync.
 */
const UPDATED_DATE = "May 11, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-primary text-brand-ink">
      <header className="border-b border-brand-chrome bg-white">
        <div className="mx-auto max-w-3xl px-5 py-3">
          <a href="/" className="text-sm font-semibold text-brand-sea">
            Rikki&apos;s Mobile Bar
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 text-base leading-relaxed text-brand-ink/90">
        <h1 className="font-heading text-2xl font-bold text-brand-ink">Privacy Policy</h1>
        <p className="mt-1 text-sm text-brand-ink/60">Last updated: {UPDATED_DATE}</p>

        <p className="mt-6">
          This policy describes how Rikki&apos;s Mobile Bar collects and uses information when you use our website,
          place drink orders at events, or receive SMS messages related to your order.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Phone numbers and SMS</h2>
        <p className="mt-2">
          Phone numbers you provide are used only for transactional communication about your drink order or event
          service (for example, a text when your drink is ready). We do not use your phone number for unrelated
          marketing.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">SMS consent</h2>
        <p className="mt-2">
          Guests may opt in to SMS by indicating consent when submitting an order. SMS consent is not shared with
          third parties or affiliates for marketing purposes.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Sale and sharing of customer data</h2>
        <p className="mt-2">
          Customer data is not sold. We do not share personal information with third parties for their own marketing.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Opt out</h2>
        <p className="mt-2">
          You may opt out of SMS at any time by following the instructions in our Terms (for example, replying STOP
          where applicable).
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Information we collect</h2>
        <p className="mt-2">
          When you place a drink order, we may collect your name, phone number, order details, and related event or
          order information.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">How we use information</h2>
        <p className="mt-2">
          We use this information to fulfill drink orders, operate event service, send transactional SMS related to your
          order when you have opted in, and maintain business records.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Data retention</h2>
        <p className="mt-2">
          Order information may be retained for event operations, business records, and service improvement as permitted
          by law.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Contact</h2>
        <p className="mt-2">
          Questions about this Privacy Policy:{" "}
          <a className="font-semibold text-brand-sea" href="mailto:rikki@rikkismobile.com">
            rikki@rikkismobile.com
          </a>
        </p>
      </main>

      <footer className="border-t border-brand-chrome bg-white text-sm text-brand-ink/70">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <p>© {new Date().getFullYear()} Rikki&apos;s Mobile Bar. Vintage mobile bar · Tri-Cities, WA.</p>
          <p className="mt-2">
            <a className="font-semibold text-brand-sea" href="/privacy">
              Privacy
            </a>
            {" · "}
            <a className="font-semibold text-brand-sea" href="/terms">
              Terms
            </a>
            {" · "}
            <a className="font-semibold text-brand-sea" href="/">
              Home
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
