export const PRESS_URL = "https://www.aol.com/articles/van-liquor-license-tri-cities-120000000.html";
export const HERALD_FEATURE_URL = "https://www.tri-cityherald.com/living/food-drink/article316829655.html";
export const HERALD_VIDEO_URL = "https://www.tri-cityherald.com/video/article316833778.html";
export const HERALD_ROUNDUP_URL = "https://www.tri-cityherald.com/living/food-drink/article317091090.html";
export const CHAMBER_URL = "https://web.tricityregionalchamber.com/Catering/Rikki%E2%80%99s-Mobile-Bar-12819";
export const KNOT_URL = "https://www.theknot.com/marketplace/rikkis-mobile-bar-benton-city-wa-2105530";

export default function AuthorityReferences() {
  return (
    <section aria-labelledby="local-connections" className="border-t border-brand-chrome/70 bg-brand-primary/40 py-10">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Our local story</p>
        <h2 id="local-connections" className="mt-2 text-2xl font-bold text-brand-ink">Rooted in the Tri-Cities</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/75">
          Based in Benton City, Rikki's brings a vintage bar and personal hospitality to celebrations across the region.
          Meet the business through our local coverage and wedding profile.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-brand-sea">
          <a href={HERALD_FEATURE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Tri-City Herald: "With a van and a liquor license..."</a>
          <a href={HERALD_VIDEO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Tri-City Herald video feature</a>
          <a href={HERALD_ROUNDUP_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Tri-City Herald food & drink roundup</a>
          <a href={PRESS_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Read our story on AOL</a>
          <a href={CHAMBER_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Regional Chamber listing</a>
          <a href={KNOT_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Find us on The Knot</a>
        </div>
      </div>
    </section>
  );
}
