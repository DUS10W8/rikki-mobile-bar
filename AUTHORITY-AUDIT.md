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

