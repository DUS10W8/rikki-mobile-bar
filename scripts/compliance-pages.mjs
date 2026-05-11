/**
 * Static HTML for /privacy and /terms (output under dist/privacy and dist/terms by create-spa-routes.mjs).
 * Crawlers and carrier review bots see full legal text in the initial HTML response without running JS.
 *
 * Keep wording aligned with src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (Vite dev).
 */

const YEAR = new Date().getFullYear();

const SHARED_STYLES = `
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#eadfc6;color:#141414;line-height:1.55;font-size:1rem}
  a{color:#2e9b8a;font-weight:600;text-decoration:none}
  a:hover{text-decoration:underline}
  header,footer{background:#fff;border-bottom:1px solid #c9c9c9}
  footer{border-top:1px solid #c9c9c9;border-bottom:none}
  .wrap{max-width:42rem;margin:0 auto;padding:1rem 1.25rem}
  main.wrap{padding-top:1.5rem;padding-bottom:2.5rem}
  h1{font-size:1.75rem;margin:0 0 0.35rem;font-weight:700}
  .meta{font-size:0.875rem;color:#444;margin:0 0 1.5rem}
  h2{font-size:1.125rem;margin:1.75rem 0 0.5rem;font-weight:700}
  p{margin:0.5rem 0}
  ul{margin:0.5rem 0;padding-left:1.25rem}
  .notice{margin:1.25rem 0;padding:0.75rem 1rem;background:#fff;border:1px solid #c9c9c9}
`;

function shell({ title, description, mainInner }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <header>
    <div class="wrap">
      <a href="/">Rikki's Mobile Bar</a>
    </div>
  </header>
  <main class="wrap">
${mainInner}
  </main>
  <footer>
    <div class="wrap" style="font-size:0.875rem;color:#444">
      <p style="margin:0">© ${YEAR} Rikki's Mobile Bar. Vintage mobile bar · Tri-Cities, WA.</p>
      <p style="margin:0.5rem 0 0">
        <a href="/privacy">Privacy</a>
        ·
        <a href="/terms">Terms</a>
        ·
        <a href="/">Home</a>
      </p>
    </div>
  </footer>
</body>
</html>`;
}

export function buildPrivacyPageHtml() {
  const mainInner = `
    <h1>Privacy Policy</h1>
    <p class="meta">Last updated: May 11, 2026</p>

    <p>
      This policy describes how Rikki's Mobile Bar collects and uses information when you use our website,
      place drink orders at events, or receive SMS messages related to your order.
    </p>

    <h2>Phone numbers and SMS</h2>
    <p>
      Phone numbers you provide are used only for transactional communication about your drink order or
      event service (for example, a text when your drink is ready). We do not use your phone number for
      unrelated marketing.
    </p>

    <h2>SMS consent</h2>
    <p>
      Guests may opt in to SMS by indicating consent when submitting an order. SMS consent is not shared with third parties or affiliates for marketing purposes.
    </p>

    <h2>Sale and sharing of customer data</h2>
    <p>
      Customer data is not sold. We do not share personal information with third parties for their own marketing.
    </p>

    <h2>Opt out</h2>
    <p>
      You may opt out of SMS at any time by following the instructions in our Terms (for example, replying STOP where applicable).
    </p>

    <h2>Information we collect</h2>
    <p>
      When you place a drink order, we may collect your name, phone number, order details, and related event or order information.
    </p>

    <h2>How we use information</h2>
    <p>
      We use this information to fulfill drink orders, operate event service, send transactional SMS related to your order when you have opted in, and maintain business records.
    </p>

    <h2>Data retention</h2>
    <p>
      Order information may be retained for event operations, business records, and service improvement as permitted by law.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about this Privacy Policy: <a href="mailto:rikki@rikkismobile.com">rikki@rikkismobile.com</a>
    </p>
  `;
  return shell({
    title: "Privacy Policy — Rikki's Mobile Bar",
    description: "Privacy Policy for Rikki's Mobile Bar, including SMS and customer data practices.",
    mainInner,
  });
}

export function buildTermsPageHtml() {
  const mainInner = `
    <h1>Terms &amp; Conditions</h1>
    <p class="meta">Last updated: May 11, 2026</p>

    <div class="notice" role="region" aria-label="SMS program disclosures">
      <p style="margin:0"><strong>Transactional SMS.</strong> By providing your mobile number and consenting where required, you agree to receive transactional SMS messages from Rikki's Mobile Bar.</p>
      <p style="margin:0.75rem 0 0"><strong>Content.</strong> Messages relate to drink orders and event services (for example, when a drink is ready for pickup).</p>
      <p style="margin:0.75rem 0 0"><strong>Frequency.</strong> Message frequency may vary based on your orders and event activity.</p>
      <p style="margin:0.75rem 0 0">Message and data rates may apply.</p>
      <p style="margin:0.75rem 0 0">Reply STOP to opt out.</p>
      <p style="margin:0.75rem 0 0">Reply HELP for assistance.</p>
    </div>

    <h2>Service</h2>
    <p>
      Rikki's Mobile Bar provides on-site beverage service. Guests may place drink orders through our website at supported events.
    </p>

    <h2>Privacy</h2>
    <p>
      Our Privacy Policy is available at
      <a href="https://www.rikkismobile.com/privacy">https://www.rikkismobile.com/privacy</a>.
    </p>

    <h2>Carriers</h2>
    <p>
      Mobile carriers are not liable for delayed or undelivered messages.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about these terms: <a href="mailto:rikki@rikkismobile.com">rikki@rikkismobile.com</a>
    </p>
  `;
  return shell({
    title: "Terms & Conditions — Rikki's Mobile Bar",
    description: "Terms and SMS program disclosures for Rikki's Mobile Bar.",
    mainInner,
  });
}
