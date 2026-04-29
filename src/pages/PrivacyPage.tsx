const UPDATED_DATE = "April 29, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-primary text-brand-ink">
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <a href="/" className="text-sm font-semibold text-brand-sea hover:opacity-80">
          Rikki's Mobile Bar
        </a>

        <section className="mt-6 rounded-2xl border border-brand-chrome bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,20,20,0.10)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-rust">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-brand-ink/60">Last updated: {UPDATED_DATE}</p>

          <div className="mt-8 space-y-7 text-base leading-relaxed text-brand-ink/80">
            <section>
              <h2 className="text-xl font-bold text-brand-ink">Information We Collect</h2>
              <p className="mt-2">
                When you place a drink order, we may collect your name, phone number, drink order details, and the event
                or order timestamp.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">How We Use Information</h2>
              <p className="mt-2">
                We use this information to process drink orders and send one-time SMS order-ready notifications related
                to your order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">SMS Consent</h2>
              <p className="mt-2">
                Guests opt in to SMS notifications by checking the consent box before submitting an order. SMS messages
                are used only for order-ready updates for that order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">No Selling or Marketing Sharing</h2>
              <p className="mt-2">
                We do not sell personal information and do not share personal information with third parties for their
                marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Data Retention</h2>
              <p className="mt-2">
                Order information may be retained for event operations, business records, and service improvement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-brand-ink">Contact</h2>
              <p className="mt-2">
                Questions about this Privacy Policy can be sent to{" "}
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
