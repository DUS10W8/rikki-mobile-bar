/**
 * Per-route SEO metadata used ONLY by the build (create-spa-routes.mjs) to bake
 * correct <title>/description/canonical/OG tags into each prerendered static
 * shell, so crawlers and link-preview bots that don't execute JS still see
 * accurate metadata. Keep title/description here in sync with the matching
 * useDocumentHead() call in the React page component.
 */
const SITE_URL = "https://www.rikkismobile.com";

export const routeSeoConfig = {
  "wedding-bartender-tri-cities-wa": {
    title: "Wedding Bartender in the Tri-Cities, WA | Rikki's Mobile Bar",
    description:
      "Licensed wedding bartender service in Richland, Kennewick & Pasco. A vintage 1985 Club Wagon mobile bar with craft cocktails, beer, wine, and full alcohol purchasing.",
  },
  "mobile-bar-tri-cities-wa": {
    title: "Mobile Bar in the Tri-Cities, WA (Richland, Kennewick, Pasco) | Rikki's Mobile Bar",
    description:
      "Licensed mobile bar service across the Tri-Cities — Richland, Kennewick & Pasco, WA. A vintage 1985 Club Wagon bar for weddings, corporate events, and private parties.",
  },
  "mobile-bar-walla-walla-wa": {
    title: "Mobile Bar & Wedding Bartender in Walla Walla, WA | Rikki's Mobile Bar",
    description:
      "Licensed mobile bar and wedding bartending for Walla Walla, WA wine-country events. A vintage 1985 Club Wagon bar with cocktails, beer & wine service.",
  },
  "licensed-mobile-bar-washington": {
    title: "Licensed Mobile Bar Service in Washington | Rikki's Mobile Bar",
    description:
      "Rikki's Mobile Bar holds a Washington liquor license, so we can purchase and serve alcohol directly for qualifying private events — no BYOB shopping required.",
  },
  blog: {
    title: "Wedding & Event Bar Planning Guides | Rikki's Mobile Bar",
    description:
      "Practical wedding and event bar planning guides from Rikki's Mobile Bar: pricing, alcohol quantities, checklists, and more for Washington hosts.",
  },
  "blog/wedding-bartender-cost-washington": {
    title: "How Much Does a Wedding Bartender Cost in Washington? | Rikki's Mobile Bar",
    description:
      "A realistic breakdown of wedding bartender and mobile bar pricing in Washington State, including what drives the cost per guest.",
  },
  "blog/how-much-alcohol-for-100-wedding-guests": {
    title: "How Much Alcohol Do You Need for 100 Wedding Guests? | Rikki's Mobile Bar",
    description:
      "A practical formula for estimating beer, wine, and liquor quantities for a 100-guest wedding hosted bar, plus how it scales to 150 guests.",
  },
  "blog/mobile-bar-vs-bartender": {
    title: "Mobile Bar vs. Traditional Bartender: What's the Difference? | Rikki's Mobile Bar",
    description:
      "Comparing a licensed mobile bar to hiring a traditional bartender-for-hire — what each includes, who buys the alcohol, and which fits your event.",
  },
  "blog/wedding-bar-checklist": {
    title: "Wedding Bar Checklist: Everything You Need | Rikki's Mobile Bar",
    description:
      "A step-by-step wedding bar planning checklist covering licensing, guest count, quantities, staffing, and venue rules for Washington weddings.",
  },
};

export function buildCanonical(route) {
  return `${SITE_URL}/${route}`;
}
