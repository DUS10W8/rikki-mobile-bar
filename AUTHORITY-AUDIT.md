# Authority audit — September 8, 2026

## Method fixed before implementation

This is a custom **authority evidence and website readiness** score, requested by the owner. It is not Semrush Authority Score, Moz DA, Ahrefs DR, a backlink-strength measurement, or a ranking prediction. Each check is worth five points; pass/fail, with unavailable evidence scored zero. Existing off-site evidence receives the same credit before and after. Local build improvements do not count as deployed until production is verified.

Baseline is the inherited working tree, before this pass, plus public evidence retrieved September 8. Claude's 25/100 was a different, unspecified rubric and cannot be compared numerically.

| Check (5 points each) | Before | After local build |
|---|---:|---:|
| Independent editorial feature identifies the business | 5 | 5 |
| Editorial feature links to business website | 5 | 5 |
| Regional Chamber listing identifies the business | 5 | 5 |
| Chamber listing links to business website | 5 | 5 |
| Wedding marketplace profile identifies the business | 5 | 5 |
| Phone matches website, Chamber and marketplace | 5 | 5 |
| Published business locality matches entity schema | 0 | 5 |
| Vehicle year consistent across verified profiles | 0 | 0 |
| Comparable package pricing reconciled across profiles | 0 | 0 |
| Named team with hospitality background visible | 5 | 5 |
| First-party event photos visible | 5 | 5 |
| Testimonials and direct Google review/profile links visible | 5 | 5 |
| Current aggregate Google rating independently verified | 0 | 0 |
| Homepage visibly links to verified editorial coverage | 0 | 5 |
| Homepage visibly links to verified business listings | 0 | 5 |
| Business schema connects verified directory identities | 0 | 5 |
| Marketing page body exists in initial HTML | 0 | 5 |
| Page-specific service/article schema exists in initial HTML | 0 | 5 |
| Website provides Instagram and Facebook links | 5 | 5 |
| Social connection page has its own initial canonical and metadata | 0 | 5 |
| **Total** | **50/100** | **85/100** |

## Evidence

- [Editorial feature, Emma Zawacki, August 24](https://www.aol.com/articles/van-liquor-license-tri-cities-120000000.html): names owners, confirms 1985 van, links website and Instagram. Existing earned coverage; not created by this work.
- [Tri-City Herald video index](https://www.tri-cityherald.com/video/): identifies the business feature dated August 24; links to https://www.tri-cityherald.com/video/article316833778.html. Individual video page unavailable to the research fetcher.
- [Chamber catering directory](https://web.tricityregionalchamber.com/Catering): Benton City, phone (509) 231-9354, website link. Existing listing.
- [The Knot profile](https://www.theknot.com/marketplace/rikkis-mobile-bar-benton-city-wa-2105530): same phone/locality, but says 1978. Cash bar starts $600; hosted/cash starts $800. Different payment models may explain prices; don't change actual prices without verifying package terms.
- Instagram and Facebook URLs exist in source; direct public fetches failed. No authenticated access or follower/engagement audit established.

## Baseline technical findings

Marketing routes have metadata shells but empty root content; route schema is client-only. Blog canonicals add a slash although hosting removes it. Operational pages are disallowed in robots.txt, preventing crawlers from reading their noindex tag. Unknown paths rewrite to homepage (soft 404). Connect inherits homepage canonical. Favicons are relative and break on nested URLs. Eager imports include staff/order tools in marketing entry. Blog publication dates are unsupported September 1 dates. Source has mixed staged/unstaged user changes: preserve the index.

## Status

Local checklist: 85/100 (17 of 20 checks). Remaining zeroes: cross-profile vehicle year, package-price reconciliation, independently verified Google aggregate. Publication remains pending; the live site has not earned these implementation points yet. Final browser verification is recorded below.

## Final implementation and validation

- Full build passes (TypeScript, Vite client build, production server render, static route generation).
- `node scripts/audit-seo.mjs`: **381 assertions pass** across homepage, nine service/blog routes, and Connect. Checks cover H1 count, canonical uniqueness, initial HTML, indexability, sitemap membership, JSON parsing of schema, local linked files/assets, operational noindex, and 404 configuration. This does not certify every Google rich-result requirement or live HTTP status.
- Targeted ESLint passes for all edited application components and build/audit scripts.
- Desktop and 390px mobile layouts inspected. The final fresh browser session reported no errors/warnings on the wedding page and homepage. Quote link reached `#book`; selecting bar service updated the estimate to $800. No real inquiry was submitted and backend delivery was not tested.
- Static pages remain visible while route JavaScript downloads. The SPA mounts the same React components to enable interaction rather than hydrating the independently built HTML. This avoids the observed hydration mismatch; it is not a framework migration or a claim of SSR on each request.
- Marketing and operational routes now load separate JavaScript chunks. The common entry is about 194KB uncompressed, with additional route/shared chunks. Do not compare that entry alone to Claude's whole 675KB bundle; no field Core Web Vitals improvement has been measured.
- Reconciled homepage header year, root-relative icons, Benton City entity locality, verified directory sameAs links, Connect canonical, and blog trailing-slash canonicals. Removed unsupported September 1 article publication dates and an unverified X handle.
- Robots now permits crawlers to read operational noindex. Removed Vercel's catch-all homepage rewrite and created 404.html. Production status codes require deployment verification; Vite preview alone is not proof of Vercel 404 behavior.
- Added visible news/Chamber/The Knot references to homepage and marketing pages. These surface existing authority; they do not create new backlinks.
- Corrected the alcohol-quantity article's inconsistent calculation and an unsourced market-wide price claim. Preserved actual business price settings. Corrected conflicting button classes that produced a low-contrast CTA.

## Pages affected and primary targets

| Route | Primary search intent | Changes this pass |
|---|---|---|
| / | Tri-Cities mobile bar | Visible trust references, entity data, year, full HTML |
| /wedding-bartender-tri-cities-wa | Wedding bartender Tri-Cities | Full HTML/schema, shared trust references |
| /mobile-bar-tri-cities-wa | Mobile bar Tri-Cities WA | Full HTML/schema, shared trust references |
| /mobile-bar-walla-walla-wa | Mobile bar Walla Walla | Full HTML/schema, shared trust references |
| /licensed-mobile-bar-washington | Licensed mobile bar Washington | More careful BYOB comparison, full HTML/schema |
| /blog | Wedding/event bar planning | Full HTML/schema and shared trust references |
| /blog/wedding-bartender-cost-washington | Wedding bartender cost Washington | Removed unsupported market-wide minimum, canonical/date cleanup |
| /blog/how-much-alcohol-for-100-wedding-guests | Wedding alcohol quantity planning | Rebuilt transparent arithmetic, aligned FAQs, canonical/date cleanup |
| /blog/mobile-bar-vs-bartender | Mobile bar vs bartender | Canonical/date cleanup, full HTML/schema |
| /blog/wedding-bar-checklist | Wedding bar checklist | Canonical/date cleanup, full HTML/schema |
| /connect | Brand social/review connections | Unique initial metadata/canonical, full HTML |
| /404.html | No search target | New non-indexable missing-page content |
| /tip, /order, /bartender | No search target | Preserved noindex, separated downloads; crawler access allowed |

Schema now available before JavaScript: existing LocalBusiness/WebSite plus route BreadcrumbList, Service, FAQPage, and BlogPosting. No fabricated AggregateRating, review count, awards, partnership, street address, or license number added. JSON validity is tested; rich-result eligibility is not guaranteed. Existing source licensing claims still need current business-license/venue confirmation.

## Live completion gate

No deployment, git commit, push, social profile edit, paid directory purchase, or outreach message was made. Existing staged/unstaged user changes were preserved. Vercel configuration and a GitHub Pages workflow both exist, but no connected publishing CLI/account was found. Owner must identify the production publishing workflow; then deploy the reviewable changes and verify public routes, HTML, metadata, 404 response, links, and booking flow. Only after that should 85/100 be described as a deployed-site audit result.

See SOCIAL-AND-LOCAL-PLAN.md for public social findings, profile copy, 20 legitimate citation/link actions, Google Business recommendations, and the 90-day plan. Outstanding priorities remain real event evidence, accurate profiles, authentic reviews, and qualified booking inquiries.

