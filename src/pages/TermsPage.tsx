/**
 * Dev / non-static hosting: simple legal layout (no accordions, no client-only legal text).
 * Production: static HTML from scripts/compliance-pages.mjs — keep wording in sync.
 */
const UPDATED_DATE = "May 11, 2026";

export default function TermsPage() {
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
        <h1 className="font-heading text-2xl font-bold text-brand-ink">Terms &amp; Conditions</h1>
        <p className="mt-1 text-sm text-brand-ink/60">Last updated: {UPDATED_DATE}</p>

        <div
          className="mt-6 space-y-3 border border-brand-chrome bg-white p-4 text-brand-ink"
          role="region"
          aria-label="SMS program disclosures"
        >
          <p className="m-0">
            <strong>Transactional SMS.</strong> By providing your mobile number and consenting where required, you
            agree to receive transactional SMS messages from Rikki&apos;s Mobile Bar.
          </p>
          <p className="m-0">
            <strong>Content.</strong> Messages relate to drink orders and event services (for example, when a drink is
            ready for pickup).
          </p>
          <p className="m-0">
            <strong>Frequency.</strong> Message frequency may vary based on your orders and event activity.
          </p>
          <p className="m-0">Message and data rates may apply.</p>
          <p className="m-0">Reply STOP to opt out.</p>
          <p className="m-0">Reply HELP for assistance.</p>
        </div>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Service</h2>
        <p className="mt-2">
          Rikki&apos;s Mobile Bar provides on-site beverage service. Guests may place drink orders through our website
          at supported events.
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Privacy</h2>
        <p className="mt-2">
          Our Privacy Policy is available at{" "}
          <a className="font-semibold text-brand-sea" href="https://www.rikkismobile.com/privacy">
            https://www.rikkismobile.com/privacy
          </a>
          .
        </p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Carriers</h2>
        <p className="mt-2">Mobile carriers are not liable for delayed or undelivered messages.</p>

        <h2 className="mt-8 text-lg font-bold text-brand-ink">Contact</h2>
        <p className="mt-2">
          Questions about these terms:{" "}
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
