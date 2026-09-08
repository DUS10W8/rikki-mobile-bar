export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  summary: string;
};

/** Single source of truth for blog listing + sitemap/prerender config. */
export const blogPosts: BlogPostMeta[] = [
  {
    slug: "wedding-bartender-cost-washington",
    title: "How Much Does a Wedding Bartender Cost in Washington?",
    description:
      "A realistic breakdown of wedding bartender and mobile bar pricing in Washington State, including what drives the cost per guest.",
    datePublished: "2026-09-01",
    summary: "What drives wedding bar pricing in WA, and how to budget for your guest count.",
  },
  {
    slug: "how-much-alcohol-for-100-wedding-guests",
    title: "How Much Alcohol Do You Need for 100 Wedding Guests?",
    description:
      "A practical formula for estimating beer, wine, and liquor quantities for a 100-guest wedding, plus how it scales for 150 guests.",
    datePublished: "2026-09-01",
    summary: "A simple per-guest formula for beer, wine & liquor at a hosted bar.",
  },
  {
    slug: "mobile-bar-vs-bartender",
    title: "Mobile Bar vs. Traditional Bartender: What's the Difference?",
    description:
      "Comparing a licensed mobile bar to hiring a traditional bartender-for-hire, including alcohol purchasing, setup, and cost.",
    datePublished: "2026-09-01",
    summary: "What each option actually includes, and which fits your event.",
  },
  {
    slug: "wedding-bar-checklist",
    title: "Wedding Bar Checklist: Everything You Need",
    description:
      "A step-by-step wedding bar planning checklist covering licensing, quantities, staffing, and venue rules.",
    datePublished: "2026-09-01",
    summary: "Everything to confirm before your wedding day, in order.",
  },
];
