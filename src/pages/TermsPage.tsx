const UPDATED_DATE = "April 29, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-primary text-brand-ink">
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <a href="/" className="text-sm font-semibold text-brand-sea hover:opacity-80">
          Rikki's Mobile Bar
        </a>

        <section className="mt-6 rounded-2xl border border-brand-chrome bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,20,20,0.10)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-rust">Terms & Conditions</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Terms & Conditions</h1>
          <p className="mt-3 text-sm text-brand-ink/60">Last updated: {UPDATED_DATE}</p>

          <div className="mt-8 space-y-7 text-base leading-relaxed text-brand-ink/80">
            <section>
              <h2 className="text-xl font-bold text-brand-ink">Service Description</h2>
              <p className="mt-2">
                Rikki's Mobile Bar provides on-site beverage service and allows guests to place drink orders through
                the website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">SMS Program Description</h2>
              <p className="mt-2">
                Users may provide their phone number when placing an order to receive a one-time SMS notification when
                their drink is ready.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Message Frequency</h2>
              <p className="mt-2">Users will receive only one message per order: the order-ready notification.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Message and Data Rates</h2>
              <p className="mt-2">Message and data rates may apply depending on the user's carrier.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Opt Out</h2>
              <p className="mt-2">Users can reply STOP to opt out of SMS messages.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Help</h2>
              <p className="mt-2">Users can reply HELP for assistance.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Privacy</h2>
              <p className="mt-2">
                Our Privacy Policy is available at{" "}
                <a className="font-semibold text-brand-sea hover:opacity-80" href="https://www.rikkismobile.com/privacy">
                  https://www.rikkismobile.com/privacy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Liability Disclaimer</h2>
              <p className="mt-2">Rikki's Mobile Bar is not responsible for delayed or undelivered messages.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Contact</h2>
              <p className="mt-2">
                Questions about these Terms & Conditions can be sent to{" "}
                <a className="font-semibold text-brand-sea hover:opacity-80" href="mailto:rikki@rikkismobile.com">
                  rikki@rikkismobile.com
                </a>
                .
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
